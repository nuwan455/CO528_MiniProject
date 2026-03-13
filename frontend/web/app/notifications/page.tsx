"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, NotificationRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { Bell, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const loadNotifications = async () => {
    const { data } = await api.get<ApiResponse<NotificationRecord[]>>("/notifications");
    setNotifications(data.data.data);
  };

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="mt-2 text-muted-foreground">Stay updated with your network.</p>
        </div>
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

      <Card className="border-border/50 bg-card/80 shadow-md backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => (
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
                <div className="mt-1 h-10 w-10 rounded-full bg-primary/10" />
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-semibold">{notification.title}</span>{" "}
                    <span className="text-muted-foreground">{notification.body}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead ? <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /> : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
