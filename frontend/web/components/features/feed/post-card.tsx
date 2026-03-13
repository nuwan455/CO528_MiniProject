import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      role: string;
      avatar?: string | null;
    };
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares?: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
  onShare?: () => void;
}

export function PostCard({ post, onLike, onShare }: PostCardProps) {
  return (
    <Card className="mb-6 overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={post.author.avatar ?? undefined} alt={post.author.name} />
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
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.content}</p>
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
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{post.comments}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-medium">{post.shares ?? "Share"}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
