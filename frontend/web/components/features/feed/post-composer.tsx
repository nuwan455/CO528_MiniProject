"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Film, Image as ImageIcon, Send, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { resolveApiAssetUrl } from "@/lib/api";

interface CreatePostInput {
  content: string;
  file?: File | null;
}

interface PostComposerProps {
  onSubmit: (input: CreatePostInput) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function PostComposer({ onSubmit, isSubmitting = false }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    setFile(nextFile ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !file) {
      return;
    }

    await onSubmit({ content: trimmed, file });
    setContent("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              placeholder="Share an update, image, or video with the department..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          {file ? (
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type.startsWith("video/") ? "Video attachment" : "Image attachment"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove attachment</span>
                </Button>
              </div>
              {previewUrl ? (
                file.type.startsWith("video/") ? (
                  <video
                    src={resolveApiAssetUrl(previewUrl) ?? previewUrl}
                    controls
                    className="max-h-80 w-full rounded-lg border border-border/60 bg-black/70 object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Selected post media preview"
                    className="max-h-80 w-full rounded-lg border border-border/60 object-cover"
                  />
                )
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="sr-only">Add image or video</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-3 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Film className="h-4 w-4" />
              <span className="text-xs font-medium">{file ? "Change media" : "Attach media"}</span>
            </Button>
          </div>
          <Button
            type="submit"
            disabled={(!content.trim() && !file) || isSubmitting}
            className="h-8 px-4 text-xs font-semibold tracking-wide"
          >
            {isSubmitting ? "Posting..." : "Post"}
            <Send className="ml-2 h-3 w-3" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
