"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, PaginatedResult, PostRecord } from "@/lib/types";
import { PostCard } from "@/components/features/feed/post-card";
import { PostComposer } from "@/components/features/feed/post-composer";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const loadPosts = async () => {
    const { data } = await api.get<ApiResponse<PaginatedResult<PostRecord>>>("/posts");
    setPosts(data.data.data.items);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    loadPosts()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Department Feed</h1>
        <p className="mt-2 text-muted-foreground">Stay updated with research, opportunities, and announcements.</p>
      </div>

      <PostComposer
        isSubmitting={isPosting}
        onSubmit={async (content) => {
          setIsPosting(true);
          try {
            await api.post("/posts", { content, visibility: "PUBLIC" });
            await loadPosts();
            showToast({ title: "Post published", description: "Your update is now live.", variant: "success" });
          } catch (error) {
            showToast({ title: "Post failed", description: getApiErrorMessage(error, "Unable to publish your post."), variant: "error" });
          } finally {
            setIsPosting(false);
          }
        }}
      />

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              author: {
                name: post.author.name,
                role: post.author.role,
              },
              content: post.content,
              timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
              likes: post._count.likes,
              comments: post._count.comments,
              shares: post._count.shares,
            }}
            onLike={async () => {
              try {
                await api.post(`/posts/${post.id}/like`);
                await loadPosts();
              } catch (error) {
                showToast({ title: "Like failed", description: getApiErrorMessage(error, "Unable to like this post."), variant: "error" });
              }
            }}
            onShare={async () => {
              try {
                await api.post(`/posts/${post.id}/share`);
                await loadPosts();
                showToast({ title: "Post shared", description: "The post was shared successfully.", variant: "success" });
              } catch (error) {
                showToast({ title: "Share failed", description: getApiErrorMessage(error, "Unable to share this post."), variant: "error" });
              }
            }}
          />
        ))}
      </div>

      {!loading && posts.length === 0 ? <p className="text-sm text-muted-foreground">No posts yet.</p> : null}
    </div>
  );
}
