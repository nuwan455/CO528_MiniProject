import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveApiAssetUrl } from "@/lib/api";
import { Heart, MessageCircle, MoreHorizontal, Send, Share2 } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      role: string;
      headline?: string | null;
      profileImageUrl?: string | null;
    };
    content: string;
    timestamp: string;
    mediaUrl?: string | null;
    mediaType: "IMAGE" | "VIDEO" | "DOCUMENT" | "NONE";
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isShared: boolean;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAtLabel: string;
    author: {
      id: string;
      name: string;
      profileImageUrl?: string | null;
    };
  }>;
  isCommentsOpen?: boolean;
  isCommentsLoading?: boolean;
  isCommentSubmitting?: boolean;
  commentDraft?: string;
  onCommentDraftChange?: (value: string) => void;
  onLike?: () => void;
  onToggleComments?: () => void;
  onSubmitComment?: () => void;
  onShare?: () => void;
}

export function PostCard({
  post,
  comments = [],
  isCommentsOpen = false,
  isCommentsLoading = false,
  isCommentSubmitting = false,
  commentDraft = "",
  onCommentDraftChange,
  onLike,
  onToggleComments,
  onSubmitComment,
  onShare,
}: PostCardProps) {
  return (
    <Card className="mb-6 overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage
              src={resolveApiAssetUrl(post.author.profileImageUrl) ?? undefined}
              alt={post.author.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {post.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">{post.author.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span>{post.author.role.replaceAll("_", " ")}</span>
              <span>&bull;</span>
              <span>{post.timestamp}</span>
            </p>
            {post.author.headline ? (
              <p className="mt-1 text-xs text-muted-foreground">{post.author.headline}</p>
            ) : null}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent>
        {post.content ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.content}</p>
        ) : null}
        {post.mediaUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/50 bg-black/80">
            {post.mediaType === "VIDEO" ? (
              <video
                src={resolveApiAssetUrl(post.mediaUrl)}
                controls
                className="max-h-[28rem] w-full object-contain"
              />
            ) : (
              <img
                src={resolveApiAssetUrl(post.mediaUrl)}
                alt={`Media shared by ${post.author.name}`}
                className="max-h-[32rem] w-full object-cover"
              />
            )}
          </div>
        ) : null}
        {isCommentsOpen ? (
          <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-3 flex gap-2">
              <Input
                value={commentDraft}
                onChange={(event) => onCommentDraftChange?.(event.target.value)}
                placeholder="Write a comment..."
                className="h-10 bg-background/80"
              />
              <Button
                type="button"
                size="sm"
                className="h-10 px-3"
                disabled={!commentDraft.trim() || isCommentSubmitting}
                onClick={onSubmitComment}
              >
                <Send className="mr-2 h-4 w-4" />
                {isCommentSubmitting ? "Posting" : "Send"}
              </Button>
            </div>
            <div className="space-y-3">
              {isCommentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 rounded-lg bg-background/80 p-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={resolveApiAssetUrl(comment.author.profileImageUrl) ?? undefined}
                        alt={comment.author.name}
                      />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{comment.author.name}</p>
                        <p className="text-xs text-muted-foreground">{comment.createdAtLabel}</p>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/85">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="border-t border-border/50 bg-muted/20 px-6 py-3">
        <div className="flex w-full items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-2 px-2 ${post.isLiked ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
            onClick={onLike}
          >
            <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">{post.likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-2 px-2 ${isCommentsOpen ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
            onClick={onToggleComments}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{post.comments}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`ml-auto h-8 gap-2 px-2 ${post.isShared ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-medium">{post.shares}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
