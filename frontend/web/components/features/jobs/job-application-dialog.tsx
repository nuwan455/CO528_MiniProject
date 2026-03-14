"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface JobApplicationDialogProps {
  open: boolean;
  jobTitle: string;
  description: string;
  selectedFileName?: string;
  isSubmitting?: boolean;
  onDescriptionChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function JobApplicationDialog({
  open,
  jobTitle,
  description,
  selectedFileName,
  isSubmitting = false,
  onDescriptionChange,
  onFileChange,
  onClose,
  onSubmit,
}: JobApplicationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-border/60 bg-card shadow-2xl">
        <CardHeader className="space-y-3">
          <CardTitle>Apply for {jobTitle}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Upload your CV and add a short description so the recruiter can review your background.
          </p>
        </CardHeader>
        <CardContent>
          <form id="job-application-form" className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="job-application-cv">
                CV / Resume
              </label>
              <Input
                id="job-application-cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {selectedFileName ? `Selected file: ${selectedFileName}` : "Accepted formats: PDF, DOC, or DOCX."}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="job-application-description">
                Short Description
              </label>
              <textarea
                id="job-application-description"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Briefly describe your skills, experience, and why you are a good fit."
                maxLength={800}
                required
              />
              <p className="text-xs text-muted-foreground">{description.length}/800 characters</p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="job-application-form" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
