"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { canApplyJobs, canPostJobs, isAdmin } from "@/lib/roles";
import { ApiResponse, JobApplicationRecord, JobRecord, PaginatedResult, UploadedDocumentRecord } from "@/lib/types";
import { JobApplicationDialog } from "@/components/features/jobs/job-application-dialog";
import { JobApplicationsDialog } from "@/components/features/jobs/job-applications-dialog";
import { JobCard } from "@/components/features/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { BriefcaseBusiness, Search } from "lucide-react";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const editorCardRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const handledApplicationsParamRef = useRef<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [query, setQuery] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobRecord | null>(null);
  const [jobToApply, setJobToApply] = useState<JobRecord | null>(null);
  const [jobForApplications, setJobForApplications] = useState<JobRecord | null>(null);
  const [jobApplications, setJobApplications] = useState<JobApplicationRecord[]>([]);
  const [loadingApplicationsJobId, setLoadingApplicationsJobId] = useState<string | null>(null);
  const [applicationNote, setApplicationNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
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
  const applicationsTargetId = searchParams.get("applications");

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

  const resetJobForm = () => {
    setJobForm({
      title: "",
      company: "",
      location: "",
      type: "FULL_TIME",
      description: "",
      deadline: "",
    });
    setEditingJobId(null);
  };

  const focusJobEditor = () => {
    editorCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => titleInputRef.current?.focus());
  };

  const resetApplicationForm = () => {
    setJobToApply(null);
    setApplicationNote("");
    setResumeFile(null);
    setIsApplying(false);
  };

  const closeApplicationsDialog = () => {
    setJobForApplications(null);
    setJobApplications([]);
    setLoadingApplicationsJobId(null);
  };

  const openApplicationsForJob = async (job: JobRecord) => {
    setJobForApplications(job);
    setJobApplications([]);
    setLoadingApplicationsJobId(job.id);

    try {
      const { data } = await api.get<ApiResponse<JobApplicationRecord[]>>(`/jobs/${job.id}/applications`);
      setJobApplications(data.data);
    } catch (error) {
      showToast({
        title: "Unable to load applications",
        description: getApiErrorMessage(error, "The submitted applications could not be loaded right now."),
        variant: "error",
      });
      setJobForApplications(null);
    } finally {
      setLoadingApplicationsJobId((current) => (current === job.id ? null : current));
    }
  };

  useEffect(() => {
    if (!applicationsTargetId || !userIsAdmin || !jobs.length) {
      return;
    }

    if (handledApplicationsParamRef.current === applicationsTargetId) {
      return;
    }

    const targetJob = jobs.find((job) => job.id === applicationsTargetId);
    if (!targetJob) {
      return;
    }

    handledApplicationsParamRef.current = applicationsTargetId;
    void openApplicationsForJob(targetJob);
  }, [applicationsTargetId, jobs, userIsAdmin]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Career Opportunities</h1>
        <p className="mt-2 text-muted-foreground">Find internships, research roles, and full-time positions.</p>
      </div>

      {userCanPostJobs ? (
        <Card ref={editorCardRef} className="mb-8 border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              {editingJobId ? "Edit Opportunity" : "Publish Department Opportunity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsSubmitting(true);
                try {
                  const payload = {
                    ...jobForm,
                    deadline: new Date(jobForm.deadline).toISOString(),
                  };

                  if (editingJobId) {
                    await api.patch(`/jobs/${editingJobId}`, payload);
                  } else {
                    await api.post("/jobs", payload);
                  }

                  resetJobForm();
                  await loadJobs();
                  showToast({
                    title: editingJobId ? "Opportunity updated" : "Opportunity posted",
                    description: editingJobId
                      ? "Your job listing changes are now live."
                      : userIsAdmin
                        ? "The department job listing is now live."
                        : "Your job or internship opportunity is now live.",
                    variant: "success",
                  });
                } catch (error) {
                  showToast({
                    title: editingJobId ? "Update failed" : "Posting failed",
                    description: getApiErrorMessage(error, editingJobId ? "Unable to update this opportunity." : "Unable to publish this opportunity."),
                    variant: "error",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Input
                ref={titleInputRef}
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
                  Admins can publish official department opportunities.
                </p>
                <div className="flex items-center gap-2">
                  {editingJobId ? (
                    <Button type="button" variant="outline" onClick={resetJobForm}>
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editingJobId ? "Saving..." : "Posting...") : editingJobId ? "Save Changes" : "Post Opportunity"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Students and alumni can browse and apply for opportunities here. Job and internship posting is reserved for admins.
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
                : undefined,
              actionDisabled: !userCanApplyJobs || appliedIds.includes(job.id),
              actionVariant: !userCanApplyJobs ? "secondary" : appliedIds.includes(job.id) ? "outline" : "default",
              helperText:
                job.postedBy.role === "ALUMNI"
                  ? `Posted by alumni member ${job.postedBy.name}.`
                  : `Posted by ${job.postedBy.name}.`,
              canManage: Boolean(user && user.role === "ADMIN"),
              canViewApplications: userIsAdmin,
            }}
            onApply={async () => {
              if (!userCanApplyJobs) {
                return;
              }

              if (appliedIds.includes(job.id)) {
                showToast({ title: "Already applied", description: "You have already applied to this job.", variant: "info" });
                return;
              }
              setJobToApply(job);
              setApplicationNote("");
              setResumeFile(null);
            }}
            onViewApplications={async () => {
              if (!userIsAdmin) {
                return;
              }
              await openApplicationsForJob(job);
            }}
            onEdit={() => {
              setEditingJobId(job.id);
              setJobForm({
                title: job.title,
                company: job.company,
                location: job.location,
                type: job.type,
                description: job.description,
                deadline: format(new Date(job.deadline), "yyyy-MM-dd'T'HH:mm"),
              });
              focusJobEditor();
            }}
            onDelete={() => setJobToDelete(job)}
            isDeleting={deletingJobId === job.id}
            isViewingApplications={loadingApplicationsJobId === job.id}
          />
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(jobToDelete)}
        title="Delete job posting?"
        description={
          jobToDelete
            ? `This will permanently remove "${jobToDelete.title}" from the platform. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Job"
        isConfirming={Boolean(jobToDelete && deletingJobId === jobToDelete.id)}
        onCancel={() => setJobToDelete(null)}
        onConfirm={async () => {
          if (!jobToDelete) {
            return;
          }

          setDeletingJobId(jobToDelete.id);
          try {
            await api.delete(`/jobs/${jobToDelete.id}`);
            if (editingJobId === jobToDelete.id) {
              resetJobForm();
            }
            await loadJobs();
            showToast({ title: "Opportunity deleted", description: "The job listing has been removed.", variant: "success" });
            setJobToDelete(null);
          } catch (error) {
            showToast({ title: "Delete failed", description: getApiErrorMessage(error, "Unable to delete this opportunity."), variant: "error" });
          } finally {
            setDeletingJobId((current) => (current === jobToDelete.id ? null : current));
          }
        }}
      />
      <JobApplicationDialog
        open={Boolean(jobToApply)}
        jobTitle={jobToApply?.title ?? "this opportunity"}
        description={applicationNote}
        selectedFileName={resumeFile?.name}
        isSubmitting={isApplying}
        onDescriptionChange={setApplicationNote}
        onFileChange={setResumeFile}
        onClose={() => {
          if (!isApplying) {
            resetApplicationForm();
          }
        }}
        onSubmit={async (event) => {
          event.preventDefault();

          if (!jobToApply) {
            return;
          }

          if (!resumeFile) {
            showToast({ title: "CV required", description: "Please upload your CV before applying.", variant: "error" });
            return;
          }

          if (!applicationNote.trim()) {
            showToast({
              title: "Description required",
              description: "Please add a short description about your application.",
              variant: "error",
            });
            return;
          }

          setIsApplying(true);
          try {
            const formData = new FormData();
            formData.append("file", resumeFile);

            const { data: uploadRes } = await api.post<ApiResponse<UploadedDocumentRecord>>("/uploads/documents", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });

            await api.post(`/jobs/${jobToApply.id}/apply`, {
              resumeUrl: uploadRes.data.documentUrl,
              coverLetter: applicationNote.trim(),
            });

            setAppliedIds((prev) => (prev.includes(jobToApply.id) ? prev : [...prev, jobToApply.id]));
            showToast({
              title: "Application submitted",
              description: "Your CV and short description were submitted successfully.",
              variant: "success",
            });
            resetApplicationForm();
          } catch (error) {
            showToast({
              title: "Application failed",
              description: getApiErrorMessage(error, "Unable to submit your application right now."),
              variant: "error",
            });
            setIsApplying(false);
          }
        }}
      />
      <JobApplicationsDialog
        open={Boolean(jobForApplications)}
        jobTitle={jobForApplications?.title ?? "this opportunity"}
        applications={jobApplications}
        isLoading={Boolean(jobForApplications && loadingApplicationsJobId === jobForApplications.id)}
        onClose={closeApplicationsDialog}
      />
    </div>
  );
}
