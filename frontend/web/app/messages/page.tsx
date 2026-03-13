"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, ConversationRecord } from "@/lib/types";
import { ChatWindow } from "@/components/features/messages/chat-window";
import { ConversationList } from "@/components/features/messages/conversation-list";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, conversations],
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="flex h-full overflow-hidden rounded-2xl border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <div className="hidden w-80 shrink-0 md:block">
          <ConversationList
            conversations={conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find((participant) => participant.user.id !== user?.id);
              const lastMessage = conversation.messages?.at(-1);
              return {
                id: conversation.id,
                name: conversation.title || otherParticipant?.user.name || "Conversation",
                lastMessage: lastMessage?.content || "No messages yet",
                timestamp: lastMessage ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }) : "New",
                unread: 0,
              };
            })}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col border-l border-border/50">
          <ChatWindow
            conversation={
              activeConversation
                ? {
                  id: activeConversation.id,
                  name:
                    activeConversation.title ||
                    activeConversation.participants.find((participant) => participant.user.id !== user?.id)?.user.name ||
                    "Conversation",
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
