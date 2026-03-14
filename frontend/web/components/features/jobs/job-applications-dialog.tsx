"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, FileText, Mail, UserRound } from "lucide-react";
import { resolveApiAssetUrl } from "@/lib/api";
import { JobApplicationRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface JobApplicationsDialogProps {
  open: boolean;
  jobTitle: string;
  applications: JobApplicationRecord[];
  isLoading?: boolean;
  onClose: () => void;
}

const statusClasses: Record<JobApplicationRecord["status"], string> = {
  APPLIED: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  REVIEWING: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  ACCEPTED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export function JobApplicationsDialog({
  open,
  jobTitle,
  applications,
  isLoading = false,
  onClose,
}: JobApplicationsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-4xl border-border/60 bg-card shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle>Applications for {jobTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review who applied, read their short description, and open the submitted CV.
          </p>
        </CardHeader>
        <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="rounded-xl border border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
              Loading submitted applications...
            </div>
          ) : applications.length ? (
            applications.map((application) => (
              <div key={application.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{application.applicant.name}</h3>
                      <Badge variant="outline" className="border-border/60 text-xs uppercase tracking-[0.18em]">
                        {(application.applicant.role ?? "APPLICANT").replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={statusClasses[application.status]}>
                        {application.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {application.applicant.email}
                      </span>
                      {application.applicant.department ? (
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          {application.applicant.department}
                          {application.applicant.batchYear ? ` • ${application.applicant.batchYear}` : ""}
                        </span>
                      ) : null}
                    </div>
                    {application.applicant.headline ? (
                      <p className="text-sm text-foreground/80">{application.applicant.headline}</p>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground md:text-right">
                    <p>{format(new Date(application.createdAt), "PPP p")}</p>
                    <p>{formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border/50 bg-card/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Short Description
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {application.coverLetter?.trim() || "No short description was provided with this application."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {application.resumeUrl ? "CV uploaded and ready to review." : "No CV file was attached."}
                  </div>
                  {application.resumeUrl ? (
                    <a
                      href={resolveApiAssetUrl(application.resumeUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <FileText className="h-4 w-4" />
                      Open CV
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
              No applications have been submitted for this opportunity yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
