"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, NotificationRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { Bell, CheckCircle2, MessageSquare, Briefcase, FlaskConical, CalendarDays } from "lucide-react";

const notificationIconMap: Record<string, typeof MessageSquare> = {
  NEW_MESSAGE: MessageSquare,
  NEW_CONVERSATION: MessageSquare,
  JOB_APPLICATION: Briefcase,
  RESEARCH_COLLABORATION: FlaskConical,
  EVENT: CalendarDays,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get<ApiResponse<NotificationRecord[]>>("/notifications");
      setNotifications(data.data);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to load your notifications.");
      setLoadError(message);
      showToast({ title: "Notifications unavailable", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => (filter === "unread" ? !notification.isRead : true)),
    [filter, notifications],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const resolveNotificationHref = (notification: NotificationRecord) => {
    if (!notification.relatedEntityId || !notification.relatedEntityType) {
      return null;
    }

    switch (notification.relatedEntityType) {
      case "CONVERSATION":
        return `/messages?conversationId=${notification.relatedEntityId}`;
      case "JOB":
        return user?.role === "ADMIN"
          ? `/jobs?applications=${notification.relatedEntityId}`
          : "/jobs";
      case "RESEARCH_PROJECT":
        return `/research?project=${notification.relatedEntityId}`;
      case "EVENT":
        return `/events?event=${notification.relatedEntityId}`;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="mt-2 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread updates across messages, research, jobs, and activity.` : "You are all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} onClick={() => setFilter("unread")}>
            Unread
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!unreadCount || isLoading}
            onClick={async () => {
              try {
                await api.patch("/notifications/read-all");
                await loadNotifications();
                showToast({ title: "Notifications updated", description: "All notifications were marked as read.", variant: "success" });
              } catch (error) {
                showToast({ title: "Update failed", description: getApiErrorMessage(error, "Unable to update notifications."), variant: "error" });
              }
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/80 shadow-md backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading notifications...</div>
            ) : loadError ? (
              <div className="flex flex-col items-start gap-3 p-6">
                <p className="text-sm text-muted-foreground">{loadError}</p>
                <Button type="button" variant="outline" onClick={() => void loadNotifications()}>
                  Retry
                </Button>
              </div>
            ) : visibleNotifications.length ? (
              visibleNotifications.map((notification) => {
                const Icon = notificationIconMap[notification.type] ?? Bell;
                const href = resolveNotificationHref(notification);

                return (
                  <button
                    type="button"
                    key={notification.id}
                    className={`flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/30 ${!notification.isRead ? "bg-primary/5" : ""}`}
                    onClick={async () => {
                      if (notification.isRead && href) {
                        router.push(href);
                        return;
                      }

                      try {
                        if (!notification.isRead) {
                          await api.patch(`/notifications/${notification.id}/read`);
                          setNotifications((current) =>
                            current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
                          );
                        }
                        if (href) {
                          router.push(href);
                        }
                      } catch (error) {
                        showToast({ title: "Update failed", description: getApiErrorMessage(error, "Unable to mark notification as read."), variant: "error" });
                      }
                    }}
                  >
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                        <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {notification.type.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      {href ? <p className="mt-2 text-xs font-medium text-primary">Open related item</p> : null}
                    </div>
                    {!notification.isRead ? <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No notifications in this view.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
