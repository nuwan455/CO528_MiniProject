"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, JobRecord, PaginatedResult } from "@/lib/types";
import { JobCard } from "@/components/features/jobs/job-card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Search } from "lucide-react";

export default function JobsPage() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [query, setQuery] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<PaginatedResult<JobRecord>>>("/jobs"),
      api.get<ApiResponse<Array<{ jobId: string }>>>("/jobs/my/applications"),
    ])
      .then(([jobsRes, appsRes]) => {
        setJobs(jobsRes.data.data.items);
        setAppliedIds((appsRes.data.data || []).map((item) => item.jobId));
      })
      .catch(() => undefined);
  }, []);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) =>
        [job.title, job.company, job.location, job.description].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [jobs, query],
  );

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Career Opportunities</h1>
        <p className="mt-2 text-muted-foreground">Find internships, research roles, and full-time positions.</p>
      </div>

      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, or keywords..."
          className="h-12 w-full rounded-xl border-border/50 bg-card/50 pl-10 text-base shadow-sm focus-visible:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={{
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              type: job.type,
              postedAt: formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }),
              deadline: format(new Date(job.deadline), "PPP"),
              description: job.description,
              applications: job._count.applications,
              isApplied: appliedIds.includes(job.id),
            }}
            onApply={async () => {
              if (appliedIds.includes(job.id)) {
                showToast({ title: "Already applied", description: "You have already applied to this job.", variant: "info" });
                return;
              }

              try {
                await api.post(`/jobs/${job.id}/apply`, {
                  resumeUrl: "",
                  coverLetter: "Submitted through the DECP web portal.",
                });
                setAppliedIds((prev) => [...prev, job.id]);
                showToast({ title: "Application submitted", description: "Your job application was sent successfully.", variant: "success" });
              } catch (error) {
                showToast({ title: "Application failed", description: getApiErrorMessage(error, "Unable to apply for this job."), variant: "error" });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
