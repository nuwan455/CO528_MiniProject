"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AnalyticsOverview, ApiResponse } from "@/lib/types";
import { OverviewChart } from "@/components/features/analytics/overview-chart";
import { StatsCard } from "@/components/features/analytics/stats-card";
import { Briefcase, Calendar, Microscope, Users } from "lucide-react";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<AnalyticsOverview>>("/analytics/overview")
      .then(({ data }) => setOverview(data.data))
      .catch(() => undefined);
  }, []);

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
