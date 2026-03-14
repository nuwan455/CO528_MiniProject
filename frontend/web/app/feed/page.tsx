"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import {
  ApiResponse,
  normalizePostRecord,
  PaginatedResult,
  PostCommentRecord,
  PostRecord,
  UploadedMediaRecord,
} from "@/lib/types";
import { PostCard } from "@/components/features/feed/post-card";
import { PostComposer } from "@/components/features/feed/post-composer";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";

function extractPostItems(apiData: ApiResponse<PaginatedResult<PostRecord>>["data"]): PostRecord[] {
  const topLevel = apiData as Partial<PaginatedResult<PostRecord>>;
  if (Array.isArray(topLevel?.items)) {
    return topLevel.items.map((post) => normalizePostRecord(post));
  }

  const nested = (apiData as { data?: Partial<PaginatedResult<PostRecord>> })?.data;
  if (Array.isArray(nested?.items)) {
    return nested.items.map((post) => normalizePostRecord(post));
  }

  return [];
}

function extractComments(apiData: ApiResponse<PostCommentRecord[]>["data"]): PostCommentRecord[] {
  if (Array.isArray(apiData)) {
    return apiData;
  }

  const nested = (apiData as { data?: PostCommentRecord[] } | undefined)?.data;
  return Array.isArray(nested) ? nested : [];
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostCommentRecord[]>>({});
  const [openCommentsByPost, setOpenCommentsByPost] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState<Record<string, boolean>>({});
  const [submittingCommentsByPost, setSubmittingCommentsByPost] = useState<Record<string, boolean>>({});

  const loadPosts = async () => {
    const { data } = await api.get<ApiResponse<PaginatedResult<PostRecord>>>("/posts");
    setPosts(extractPostItems(data.data));
  };

  const loadComments = async (postId: string) => {
    setLoadingCommentsByPost((current) => ({ ...current, [postId]: true }));
    try {
      const { data } = await api.get<ApiResponse<PostCommentRecord[]>>(`/posts/${postId}/comments`);
      setCommentsByPost((current) => ({ ...current, [postId]: extractComments(data.data) }));
    } finally {
      setLoadingCommentsByPost((current) => ({ ...current, [postId]: false }));
    }
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
        onSubmit={async ({ content, file }) => {
          setIsPosting(true);
          try {
            let uploadedMedia: UploadedMediaRecord | undefined;

            if (file) {
              const formData = new FormData();
              formData.append("file", file);
              const { data } = await api.post<ApiResponse<UploadedMediaRecord>>("/uploads/media", formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
              uploadedMedia = data.data;
            }

            await api.post("/posts", {
              content,
              mediaUrl: uploadedMedia?.mediaUrl,
              mediaType: uploadedMedia?.mediaType ?? "NONE",
              visibility: "PUBLIC",
            });
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
              mediaUrl: post.mediaUrl,
              mediaType: post.mediaType,
              likes: post._count.likes,
              comments: post._count.comments,
              shares: post._count.shares,
              isLiked: post.interactions.isLiked,
              isShared: post.interactions.isShared,
            }}
            comments={(commentsByPost[post.id] ?? []).map((comment) => ({
              id: comment.id,
              content: comment.content,
              createdAtLabel: formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }),
              author: {
                id: comment.author.id,
                name: comment.author.name,
                profileImageUrl: comment.author.profileImageUrl,
              },
            }))}
            isCommentsOpen={Boolean(openCommentsByPost[post.id])}
            isCommentsLoading={Boolean(loadingCommentsByPost[post.id])}
            isCommentSubmitting={Boolean(submittingCommentsByPost[post.id])}
            commentDraft={commentDrafts[post.id] ?? ""}
            onCommentDraftChange={(value) =>
              setCommentDrafts((current) => ({
                ...current,
                [post.id]: value,
              }))
            }
            onLike={async () => {
              try {
                if (post.interactions.isLiked) {
                  await api.delete(`/posts/${post.id}/like`);
                } else {
                  await api.post(`/posts/${post.id}/like`);
                }
                await loadPosts();
              } catch (error) {
                showToast({ title: "Like failed", description: getApiErrorMessage(error, "Unable to like this post."), variant: "error" });
              }
            }}
            onToggleComments={async () => {
              const nextIsOpen = !openCommentsByPost[post.id];
              setOpenCommentsByPost((current) => ({ ...current, [post.id]: nextIsOpen }));

              if (nextIsOpen && commentsByPost[post.id] === undefined) {
                try {
                  await loadComments(post.id);
                } catch (error) {
                  showToast({
                    title: "Comments unavailable",
                    description: getApiErrorMessage(error, "Unable to load comments."),
                    variant: "error",
                  });
                }
              }
            }}
            onSubmitComment={async () => {
              const content = commentDrafts[post.id]?.trim();
              if (!content) {
                return;
              }

              setSubmittingCommentsByPost((current) => ({ ...current, [post.id]: true }));
              try {
                await api.post(`/posts/${post.id}/comments`, { content });
                setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
                await Promise.all([loadComments(post.id), loadPosts()]);
              } catch (error) {
                showToast({
                  title: "Comment failed",
                  description: getApiErrorMessage(error, "Unable to add your comment."),
                  variant: "error",
                });
              } finally {
                setSubmittingCommentsByPost((current) => ({ ...current, [post.id]: false }));
              }
            }}
            onShare={async () => {
              try {
                await api.post(`/posts/${post.id}/share`);
                await loadPosts();
                const shareText = post.content.trim() || `${post.author.name} shared a media post on the department feed.`;
                if (typeof navigator !== "undefined" && navigator.share) {
                  try {
                    await navigator.share({
                      title: `${post.author.name}'s department post`,
                      text: shareText,
                    });
                  } catch {
                    // Ignore share-sheet cancellations after recording the share.
                  }
                } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                  await navigator.clipboard.writeText(shareText);
                }
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
