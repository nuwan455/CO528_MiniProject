"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const [query, setQuery] = useState("");

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) =>
        [conv.name, conv.lastMessage].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [conversations, query],
  );

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="border-b border-border/50 p-4">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 w-full rounded-full border-none bg-accent/50 pl-9 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all",
              activeId === conv.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-accent/50",
            )}
          >
            <Avatar className="h-10 w-10 shrink-0 border border-primary/20">
              <AvatarImage src={conv.avatar ?? undefined} alt={conv.name} />
              <AvatarFallback className="bg-primary/10 font-medium text-primary">
                {conv.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className={cn("truncate text-sm font-medium", activeId === conv.id ? "text-primary" : "text-foreground")}>
                  {conv.name}
                </span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{conv.timestamp}</span>
              </div>
              <p className={cn("truncate text-xs", conv.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                {conv.lastMessage}
              </p>
            </div>
            {conv.unread > 0 ? <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
