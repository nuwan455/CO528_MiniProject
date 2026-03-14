"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, NotificationRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { Bell, CheckCircle2, MessageSquare, Briefcase, FlaskConical, CalendarDays } from "lucide-react";

const notificationIconMap: Record<string, typeof MessageSquare> = {
  NEW_MESSAGE: MessageSquare,
  NEW_CONVERSATION: MessageSquare,
  JOB_APPLICATION: Briefcase,
  RESEARCH_COLLABORATION: FlaskConical,
  EVENT: CalendarDays,
};

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = async () => {
    const { data } = await api.get<ApiResponse<NotificationRecord[]>>("/notifications");
    setNotifications(data.data);
  };

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, []);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => (filter === "unread" ? !notification.isRead : true)),
    [filter, notifications],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

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
            {visibleNotifications.length ? (
              visibleNotifications.map((notification) => {
                const Icon = notificationIconMap[notification.type] ?? Bell;

                return (
                  <button
                    key={notification.id}
                    className={`flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/30 ${!notification.isRead ? "bg-primary/5" : ""}`}
                    onClick={async () => {
                      if (notification.isRead) {
                        return;
                      }

                      try {
                        await api.patch(`/notifications/${notification.id}/read`);
                        await loadNotifications();
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
