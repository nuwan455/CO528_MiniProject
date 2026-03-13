"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FileText, Image as ImageIcon, Link2, Send } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface PostComposerProps {
  onSubmit: (content: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function PostComposer({ onSubmit, isSubmitting = false }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    await onSubmit(trimmed);
    setContent("");
  };

  return (
    <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm shadow-md">
      <form onSubmit={handleSubmit}>
        <CardContent className="pb-2 pt-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <textarea
              className="min-h-[100px] w-full resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
              placeholder="Share an update, research finding, or opportunity..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <ImageIcon className="h-4 w-4" />
              <span className="sr-only">Add image</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <Link2 className="h-4 w-4" />
              <span className="sr-only">Add link</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <FileText className="h-4 w-4" />
              <span className="sr-only">Add document</span>
            </Button>
          </div>
          <Button type="submit" disabled={!content.trim() || isSubmitting} className="h-8 px-4 text-xs font-semibold tracking-wide">
            {isSubmitting ? "Posting..." : "Post"}
            <Send className="ml-2 h-3 w-3" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
