"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, normalizePostRecord, PaginatedResult, PostRecord, WebUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/features/feed/post-card";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { Briefcase, GraduationCap, Link as LinkIcon, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [postToDelete, setPostToDelete] = useState<PostRecord | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const loadProfile = async () => {
    const [userRes, postsRes] = await Promise.all([
      api.get<ApiResponse<WebUser>>("/users/me"),
      api.get<ApiResponse<PaginatedResult<PostRecord>>>("/posts"),
    ]);

    const currentUser = userRes.data.data;
    const items = postsRes.data.data.items.map((post) => normalizePostRecord(post));
    updateUser(currentUser);
    setPosts(items.filter((post) => post.author.id === currentUser.id));
  };

  useEffect(() => {
    loadProfile().catch(() => undefined);
  }, [updateUser]);

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <Card className="mb-8 overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="relative h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
        <CardContent className="relative px-8 pb-8 pt-0">
          <div className="-mt-16 mb-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-6">
              <Avatar className="h-32 w-32 border-4 border-card bg-card shadow-xl">
                <AvatarImage src={user.profileImageUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-4xl font-bold text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                <p className="text-lg font-medium text-primary">{user.headline || user.role}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="leading-relaxed text-foreground/90">
                {user.bio || "Profile ready for department networking, industry outreach, and research collaboration."}
              </p>
              <div className="space-y-2 border-t border-border/50 pt-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-primary/70" />
                  <span>{user.department || "Computer Science Department"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-primary/70" />
                  <span>{user.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <span>Department community member</span>
                </div>
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-primary/70" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Skills & Interests</h3>
              <div className="flex flex-wrap gap-2">
                {(user.skills?.length ? user.skills : ["Networking", "Research", "Career Growth"]).map((skill) => (
                  <span key={skill} className="rounded-full border border-border/50 bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="h-12 w-full justify-start space-x-6 rounded-none border-b border-border/50 bg-transparent p-0">
          <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Activity & Posts
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Research Projects
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="pt-6">
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  author: {
                    name: post.author.name,
                    role: post.author.role,
                    headline: post.author.headline,
                    profileImageUrl: post.author.profileImageUrl,
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
                canDelete
                isDeleting={deletingPostId === post.id}
                onDelete={() => setPostToDelete(post)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="projects" className="pt-6">
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 py-12 text-center text-muted-foreground">
            Research module exists in the backend and is ready for the next UI pass.
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Delete post?"
        description={
          postToDelete
            ? "This will permanently remove your post from your profile and the department feed."
            : ""
        }
        confirmLabel="Delete Post"
        isConfirming={Boolean(postToDelete && deletingPostId === postToDelete.id)}
        onCancel={() => setPostToDelete(null)}
        onConfirm={async () => {
          if (!postToDelete) {
            return;
          }

          setDeletingPostId(postToDelete.id);
          try {
            await api.delete(`/posts/${postToDelete.id}`);
            await loadProfile();
            showToast({
              title: "Post deleted",
              description: "Your post has been removed.",
              variant: "success",
            });
            setPostToDelete(null);
          } catch (error) {
            showToast({
              title: "Delete failed",
              description: getApiErrorMessage(error, "Unable to delete this post."),
              variant: "error",
            });
          } finally {
            setDeletingPostId((current) => (current === postToDelete.id ? null : current));
          }
        }}
      />
    </div>
  );
}
