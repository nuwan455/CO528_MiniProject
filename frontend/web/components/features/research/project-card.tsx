import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveApiAssetUrl } from "@/lib/api";
import { FileText, Search, Users } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    documentUrl?: string | null;
    lead: {
      name: string;
      headline?: string | null;
      avatar?: string | null;
    };
    collaborators: Array<{
      id: string;
      roleInProject: string;
      user: {
        id: string;
        name: string;
        email: string;
        profileImageUrl?: string | null;
      };
    }>;
    tags: string[];
    isCollaborator?: boolean;
    canManage?: boolean;
  };
  isExpanded?: boolean;
  inviteQuery?: string;
  inviteRole?: string;
  inviteResults?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    profileImageUrl?: string | null;
  }>;
  isSearching?: boolean;
  isInviting?: boolean;
  onToggleExpand?: () => void;
  onInviteQueryChange?: (value: string) => void;
  onInviteRoleChange?: (value: string) => void;
  onInvite?: (userId: string) => void;
}

export function ProjectCard({
  project,
  isExpanded = false,
  inviteQuery = "",
  inviteRole = "Collaborator",
  inviteResults = [],
  isSearching = false,
  isInviting = false,
  onToggleExpand,
  onInviteQueryChange,
  onInviteRoleChange,
  onInvite,
}: ProjectCardProps) {
  return (
    <Card className="group flex h-full flex-col border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {project.title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 font-medium ${
              project.status === "Active"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/50 bg-amber-500/10 text-amber-500"
            }`}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-6 pb-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarImage src={resolveApiAssetUrl(project.lead.avatar) ?? undefined} alt={project.lead.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {project.lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Lead Researcher</span>
              <span className="text-sm font-medium text-foreground">{project.lead.name}</span>
              {project.lead.headline ? (
                <span className="text-xs text-muted-foreground">{project.lead.headline}</span>
              ) : null}
            </div>
          </div>

          <div className="h-8 w-px bg-border/50" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary/70" />
            <span>{project.collaborators.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80 font-normal text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {isExpanded ? (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Shared Document</p>
                <p className="text-xs text-muted-foreground">
                  Upload and share working papers, proposals, or datasets with collaborators.
                </p>
              </div>
              {project.documentUrl ? (
                <a
                  href={resolveApiAssetUrl(project.documentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-foreground hover:bg-background/70"
                >
                  <FileText className="h-4 w-4" />
                  Open
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No document yet</span>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Collaborators</p>
              <div className="space-y-3">
                {project.collaborators.length ? (
                  project.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center gap-3 rounded-lg bg-background/70 p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={resolveApiAssetUrl(collaborator.user.profileImageUrl) ?? undefined}
                          alt={collaborator.user.name}
                        />
                        <AvatarFallback>{collaborator.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{collaborator.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {collaborator.roleInProject} · {collaborator.user.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No collaborators invited yet.</p>
                )}
              </div>
            </div>

            {project.canManage ? (
              <div className="space-y-3 border-t border-border/50 pt-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Invite Collaborators</p>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <Input
                    value={inviteQuery}
                    onChange={(event) => onInviteQueryChange?.(event.target.value)}
                    placeholder="Search by name, email, or department..."
                  />
                  <Input
                    value={inviteRole}
                    onChange={(event) => onInviteRoleChange?.(event.target.value)}
                    placeholder="Role in project"
                  />
                </div>
                <div className="space-y-2">
                  {isSearching ? (
                    <p className="text-sm text-muted-foreground">Searching users...</p>
                  ) : inviteResults.length ? (
                    inviteResults.map((candidate) => (
                      <div key={candidate.id} className="flex items-center gap-3 rounded-lg bg-background/70 p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={resolveApiAssetUrl(candidate.profileImageUrl) ?? undefined}
                            alt={candidate.name}
                          />
                          <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{candidate.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {candidate.email} · {candidate.role.replaceAll("_", " ")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={isInviting}
                          onClick={() => onInvite?.(candidate.id)}
                        >
                          Invite
                        </Button>
                      </div>
                    ))
                  ) : inviteQuery.trim() ? (
                    <p className="text-sm text-muted-foreground">No matching users found.</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Search for users to invite them into this project.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-6 py-4 pt-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={onToggleExpand}>
          <FileText className="h-4 w-4" />
          {isExpanded ? "Hide Details" : "Details"}
        </Button>
        <Button size="sm" variant={project.isCollaborator ? "secondary" : "default"} className="gap-2 font-medium" onClick={onToggleExpand}>
          {project.isCollaborator ? "Manage" : "View Collaboration"}
        </Button>
      </CardFooter>
    </Card>
  );
}
