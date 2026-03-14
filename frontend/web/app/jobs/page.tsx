"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { canApplyJobs, canPostJobs, isAdmin } from "@/lib/roles";
import { ApiResponse, JobRecord, PaginatedResult } from "@/lib/types";
import { JobCard } from "@/components/features/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { BriefcaseBusiness, Search } from "lucide-react";

export default function JobsPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [query, setQuery] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "FULL_TIME",
    description: "",
    deadline: "",
  });

  const userCanPostJobs = canPostJobs(user);
  const userCanApplyJobs = canApplyJobs(user);
  const userIsAdmin = isAdmin(user);

  const loadJobs = async () => {
    const [{ data: jobsRes }, appsRes] = await Promise.all([
      api.get<ApiResponse<PaginatedResult<JobRecord>>>("/jobs"),
      userCanApplyJobs
        ? api.get<ApiResponse<Array<{ jobId: string }>>>("/jobs/my/applications")
        : Promise.resolve(undefined),
    ]);

    setJobs(jobsRes.data.items);
    setAppliedIds((appsRes?.data.data || []).map((item) => item.jobId));
  };

  useEffect(() => {
    loadJobs().catch(() => undefined);
  }, [userCanApplyJobs]);

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

      {userCanPostJobs ? (
        <Card className="mb-8 border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              {userIsAdmin ? "Publish Department Opportunity" : "Share an Alumni Opportunity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsSubmitting(true);
                try {
                  await api.post("/jobs", {
                    ...jobForm,
                    deadline: new Date(jobForm.deadline).toISOString(),
                  });
                  setJobForm({
                    title: "",
                    company: "",
                    location: "",
                    type: "FULL_TIME",
                    description: "",
                    deadline: "",
                  });
                  await loadJobs();
                  showToast({
                    title: "Opportunity posted",
                    description: userIsAdmin
                      ? "The department job listing is now live."
                      : "Your job or internship opportunity is now live.",
                    variant: "success",
                  });
                } catch (error) {
                  showToast({
                    title: "Posting failed",
                    description: getApiErrorMessage(error, "Unable to publish this opportunity."),
                    variant: "error",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Input
                value={jobForm.title}
                onChange={(e) => setJobForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Job title"
                required
              />
              <Input
                value={jobForm.company}
                onChange={(e) => setJobForm((current) => ({ ...current, company: e.target.value }))}
                placeholder="Company or organization"
                required
              />
              <Input
                value={jobForm.location}
                onChange={(e) => setJobForm((current) => ({ ...current, location: e.target.value }))}
                placeholder="Location"
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={jobForm.type}
                onChange={(e) => setJobForm((current) => ({ ...current, type: e.target.value }))}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CONTRACT">Contract</option>
              </select>
              <Input
                type="datetime-local"
                value={jobForm.deadline}
                onChange={(e) => setJobForm((current) => ({ ...current, deadline: e.target.value }))}
                required
              />
              <textarea
                className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
                value={jobForm.description}
                onChange={(e) => setJobForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Describe the role, expectations, and how applicants should prepare."
                required
              />
              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {userIsAdmin
                    ? "Admins can publish official department opportunities."
                    : "Alumni can share internships, placements, and mentorship-linked opportunities."}
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post Opportunity"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Students can browse and apply for opportunities here. Job and internship posting is reserved for alumni and admins.
            </p>
          </CardContent>
        </Card>
      )}

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
              actionLabel: userCanApplyJobs
                ? appliedIds.includes(job.id)
                  ? "Applied Successfully"
                  : "Apply Now"
                : "Admins Cannot Apply",
              actionDisabled: !userCanApplyJobs || appliedIds.includes(job.id),
              actionVariant: !userCanApplyJobs ? "secondary" : appliedIds.includes(job.id) ? "outline" : "default",
              helperText: userCanApplyJobs
                ? job.postedBy.role === "ALUMNI"
                  ? `Posted by alumni member ${job.postedBy.name}.`
                  : `Posted by ${job.postedBy.name}.`
                : "Admins can publish opportunities and oversee hiring activity, but they do not apply to roles.",
            }}
            onApply={async () => {
              if (!userCanApplyJobs) {
                return;
              }

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
