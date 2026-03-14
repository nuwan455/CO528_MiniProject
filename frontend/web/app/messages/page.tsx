"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api, { resolveApiAssetUrl } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, ConversationRecord, PaginatedResult, WebUser } from "@/lib/types";
import { ChatWindow } from "@/components/features/messages/chat-window";
import { ConversationList } from "@/components/features/messages/conversation-list";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { Search } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WebUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const loadConversations = async () => {
    const { data } = await api.get<ApiResponse<ConversationRecord[]>>("/messages/conversations");
    const items = data.data;
    setConversations(items);
    if (!activeId && items[0]) {
      setActiveId(items[0].id);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data } = await api.get<ApiResponse<ConversationRecord>>(`/messages/conversations/${conversationId}`);
    setConversations((prev) => prev.map((item) => (item.id === conversationId ? data.data : item)));
  };

  useEffect(() => {
    loadConversations().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeId) {
      loadConversation(activeId).catch(() => undefined);
    }
  }, [activeId]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get<ApiResponse<PaginatedResult<WebUser>>>("/users/search", {
          params: { q: trimmed, limit: 6 },
        });
        setSearchResults(data.data.items.filter((candidate) => candidate.id !== user?.id));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, conversations],
  );

  const conversationSummaries = useMemo(
    () =>
      conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find((participant) => participant.user.id !== user?.id);
        const lastMessage = conversation.messages?.[0];

        return {
          id: conversation.id,
          name: conversation.title || otherParticipant?.user.name || "Conversation",
          avatar: otherParticipant?.user.profileImageUrl ? resolveApiAssetUrl(otherParticipant.user.profileImageUrl) : null,
          lastMessage: lastMessage?.content || "No messages yet",
          timestamp: lastMessage ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }) : "New",
          unread: 0,
        };
      }),
    [conversations, user?.id],
  );

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <Card className="border-border/50 bg-card/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">Start direct conversations with students, alumni, and admins.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users to start a conversation..."
              className="h-10 pl-9"
            />
            {searchQuery.trim() ? (
              <div className="absolute left-0 right-0 top-12 z-20 rounded-xl border border-border/60 bg-card shadow-xl">
                {isSearching ? (
                  <p className="p-3 text-sm text-muted-foreground">Searching users...</p>
                ) : searchResults.length ? (
                  <div className="max-h-72 overflow-y-auto p-2">
                    {searchResults.map((candidate) => (
                      <button
                        key={candidate.id}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-accent/40"
                        onClick={async () => {
                          setIsStartingConversation(true);
                          try {
                            const { data } = await api.post<ApiResponse<ConversationRecord>>("/messages/conversations", {
                              type: "DIRECT",
                              participantIds: [candidate.id],
                            });
                            setSearchQuery("");
                            setSearchResults([]);
                            await loadConversations();
                            setActiveId(data.data.id);
                            showToast({
                              title: "Conversation ready",
                              description: `You can now message ${candidate.name}.`,
                              variant: "success",
                            });
                          } catch (error) {
                            showToast({
                              title: "Conversation failed",
                              description: getApiErrorMessage(error, "Unable to start this conversation."),
                              variant: "error",
                            });
                          } finally {
                            setIsStartingConversation(false);
                          }
                        }}
                        disabled={isStartingConversation}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{candidate.role.replaceAll("_", " ")}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">No users found.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="flex h-[calc(100%-6rem)] overflow-hidden rounded-2xl border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <div className="hidden w-80 shrink-0 md:block">
          <ConversationList
            conversations={conversationSummaries}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col border-l border-border/50">
          <div className="border-b border-border/50 p-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {conversationSummaries.length ? (
                conversationSummaries.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveId(conversation.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      activeId === conversation.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-card text-muted-foreground"
                    }`}
                  >
                    {conversation.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Start a conversation to see it here.</p>
              )}
            </div>
          </div>
          <ChatWindow
            conversation={
              activeConversation
                ? {
                    id: activeConversation.id,
                    name:
                      activeConversation.title ||
                      activeConversation.participants.find((participant) => participant.user.id !== user?.id)?.user.name ||
                      "Conversation",
                    avatar: resolveApiAssetUrl(
                      activeConversation.participants.find((participant) => participant.user.id !== user?.id)?.user.profileImageUrl,
                    ),
                    status: `${activeConversation._count.messages} messages`,
                  }
                : null
            }
            messages={
              activeConversation?.messages?.map((message) => ({
                id: message.id,
                senderId: message.sender.id === user?.id ? "me" : message.sender.id,
                text: message.content,
                timestamp: formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }),
              })) ?? []
            }
            isSending={isSending}
            onSendMessage={async (content) => {
              if (!activeId) {
                return;
              }

              setIsSending(true);
              try {
                await api.post(`/messages/conversations/${activeId}/messages`, { content, messageType: "TEXT" });
                await loadConversations();
                await loadConversation(activeId);
                showToast({ title: "Message sent", description: "Your message has been delivered.", variant: "success" });
              } catch (error) {
                showToast({ title: "Message failed", description: getApiErrorMessage(error, "Unable to send your message."), variant: "error" });
              } finally {
                setIsSending(false);
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
}
