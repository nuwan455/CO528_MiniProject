"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, MoreVertical, Paperclip, Phone, Send, Smile, Video } from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface ChatWindowProps {
  conversation: {
    id: string;
    name: string;
    avatar?: string | null;
    status: string;
  } | null;
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void> | void;
  isSending?: boolean;
}

export function ChatWindow({ conversation, messages, onSendMessage, isSending = false }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-card/10 text-muted-foreground backdrop-blur-sm">
        <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-card/20 backdrop-blur-sm">
      <div className="z-10 flex h-16 items-center justify-between border-b border-border/50 bg-card/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={conversation.avatar ?? undefined} alt={conversation.name} />
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {conversation.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{conversation.name}</h3>
            <p className="text-xs text-emerald-500">{conversation.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === "me";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[70%] gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe ? (
                  <Avatar className="mt-auto h-8 w-8 shrink-0 border border-primary/20">
                    <AvatarImage src={conversation.avatar ?? undefined} alt={conversation.name} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {conversation.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMe
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border/50 bg-accent/80 text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-muted-foreground">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/50 bg-card/50 p-4 backdrop-blur-md">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = newMessage.trim();
            if (!trimmed) {
              return;
            }

            await onSendMessage(trimmed);
            setNewMessage("");
          }}
          className="flex items-center gap-2"
        >
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="h-10 w-full rounded-full border-none bg-accent/50 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className="h-10 w-10 shrink-0 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
