import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Briefcase, Building2, Clock, MapPin } from "lucide-react";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    postedAt: string;
    deadline: string;
    description: string;
    applications: number;
    isApplied?: boolean;
    actionLabel?: string;
    actionDisabled?: boolean;
    actionVariant?: "default" | "outline" | "secondary";
    helperText?: string;
    canManage?: boolean;
    canViewApplications?: boolean;
  };
  onApply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewApplications?: () => void;
  isDeleting?: boolean;
  isViewingApplications?: boolean;
}

export function JobCard({
  job,
  onApply,
  onEdit,
  onDelete,
  onViewApplications,
  isDeleting = false,
  isViewingApplications = false,
}: JobCardProps) {
  return (
    <Card className="group flex h-full flex-col border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
              {job.title}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <Badge variant={job.isApplied ? "secondary" : "outline"}>
            {job.isApplied ? "Applied" : job.type.replaceAll("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary/70" />
            <span>{job.applications} applications</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/70" />
            <span>Posted {job.postedAt}</span>
          </div>
        </div>
        <p className="line-clamp-4 text-sm leading-6 text-foreground/85">{job.description}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Apply before {job.deadline}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <Button
            type="button"
            className="w-full font-medium tracking-wide"
            variant={job.actionVariant ?? (job.isApplied ? "outline" : "default")}
            onClick={onApply}
            disabled={job.actionDisabled}
          >
            {job.actionLabel ?? (job.isApplied ? "Applied Successfully" : "Apply Now")}
          </Button>
          {job.canViewApplications ? (
            <Button type="button" variant="secondary" className="w-full" onClick={onViewApplications} disabled={isViewingApplications}>
              {isViewingApplications ? "Loading applications..." : `View Applications (${job.applications})`}
            </Button>
          ) : null}
          {job.canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ) : null}
          {job.helperText ? <p className="text-xs text-muted-foreground">{job.helperText}</p> : null}
        </div>
      </CardFooter>
    </Card>
  );
}
