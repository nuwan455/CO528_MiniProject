"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { canAccessAnalytics } from "@/lib/roles";
import { AnalyticsOverview, ApiResponse } from "@/lib/types";
import { OverviewChart } from "@/components/features/analytics/overview-chart";
import { StatsCard } from "@/components/features/analytics/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { Briefcase, Calendar, Microscope, Users } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const userCanAccessAnalytics = canAccessAnalytics(user);

  useEffect(() => {
    if (!userCanAccessAnalytics) {
      return;
    }

    api
      .get<ApiResponse<AnalyticsOverview>>("/analytics/overview")
      .then(({ data }) => setOverview(data.data))
      .catch(() => undefined);
  }, [userCanAccessAnalytics]);

  if (!userCanAccessAnalytics) {
    return (
      <div className="py-8">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-foreground">Analytics Access Restricted</h1>
            <p className="mt-2 text-muted-foreground">
              The analytics dashboard is available only to admin accounts because it contains department-wide platform metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Department Analytics</h1>
        <p className="mt-2 text-muted-foreground">Overview of engagement and platform usage.</p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={overview?.activeUsers ?? "-"} icon={Users} />
        <StatsCard title="Active Jobs" value={overview?.jobs ?? "-"} icon={Briefcase} />
        <StatsCard title="Event RSVPs" value={overview?.eventRsvps ?? "-"} icon={Calendar} />
        <StatsCard
          title="Top Module"
          value={overview?.mostActiveModules?.[0]?.module ?? "-"}
          description={overview?.mostActiveModules?.[0] ? `${overview.mostActiveModules[0].count} total interactions` : undefined}
          icon={Microscope}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <OverviewChart data={overview?.mostActiveModules} />
      </div>
    </div>
  );
}
