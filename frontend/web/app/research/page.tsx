"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import {
  ApiResponse,
  PaginatedResult,
  ResearchProjectRecord,
  UploadedDocumentRecord,
  WebUser,
} from "@/lib/types";
import { ProjectCard } from "@/components/features/research/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function ResearchPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ResearchProjectRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchingProjectId, setSearchingProjectId] = useState<string | null>(null);
  const [invitingProjectId, setInvitingProjectId] = useState<string | null>(null);
  const [inviteQueries, setInviteQueries] = useState<Record<string, string>>({});
  const [inviteRoles, setInviteRoles] = useState<Record<string, string>>({});
  const [inviteResults, setInviteResults] = useState<Record<string, WebUser[]>>({});
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const loadProjects = async () => {
    const { data } = await api.get<ApiResponse<PaginatedResult<ResearchProjectRecord>>>("/research/projects");
    setProjects(data.data.items);
  };

  useEffect(() => {
    loadProjects().catch(() => undefined);
  }, []);

  useEffect(() => {
    const activeProjectId = expandedProjectId;
    const activeQuery = activeProjectId ? inviteQueries[activeProjectId]?.trim() : "";

    if (!activeProjectId || !activeQuery) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchingProjectId(activeProjectId);
      try {
        const { data } = await api.get<ApiResponse<PaginatedResult<WebUser>>>("/users/search", {
          params: { q: activeQuery, limit: 8 },
        });
        const items = data.data.items.filter((candidate) => candidate.id !== user?.id);
        setInviteResults((current) => ({ ...current, [activeProjectId]: items }));
      } catch {
        setInviteResults((current) => ({ ...current, [activeProjectId]: [] }));
      } finally {
        setSearchingProjectId((current) => (current === activeProjectId ? null : current));
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [expandedProjectId, inviteQueries, user?.id]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        [project.title, project.description, ...project.tags].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, query],
  );

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Research Projects</h1>
        <p className="mt-2 text-muted-foreground">Create projects, share working documents, and invite collaborators.</p>
      </div>

      <Card className="mb-8 border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle>Create Research Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSubmitting(true);
              try {
                let uploadedDocument: UploadedDocumentRecord | undefined;

                if (documentFile) {
                  const formData = new FormData();
                  formData.append("file", documentFile);
                  const { data } = await api.post<ApiResponse<UploadedDocumentRecord>>("/uploads/documents", formData, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  uploadedDocument = data.data;
                }

                await api.post("/research/projects", {
                  title: projectForm.title,
                  description: projectForm.description,
                  tags: projectForm.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  documentUrl: uploadedDocument?.documentUrl,
                });

                setProjectForm({ title: "", description: "", tags: "" });
                setDocumentFile(null);
                await loadProjects();
                showToast({
                  title: "Project created",
                  description: "Your research project is now ready for collaboration.",
                  variant: "success",
                });
              } catch (error) {
                showToast({
                  title: "Project creation failed",
                  description: getApiErrorMessage(error, "Unable to create this research project."),
                  variant: "error",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <Input
              value={projectForm.title}
              onChange={(e) => setProjectForm((current) => ({ ...current, title: e.target.value }))}
              placeholder="Project title"
              required
            />
            <Input
              value={projectForm.tags}
              onChange={(e) => setProjectForm((current) => ({ ...current, tags: e.target.value }))}
              placeholder="Tags, comma separated"
            />
            <textarea
              className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
              value={projectForm.description}
              onChange={(e) => setProjectForm((current) => ({ ...current, description: e.target.value }))}
              placeholder="Describe the idea, methods, goals, and who should collaborate."
              required
            />
            <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/50 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Research Document</p>
                <p className="text-xs text-muted-foreground">
                  Upload a proposal, literature review, or draft paper to share with collaborators.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                  className="max-w-xs"
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects by title, lead, or tags..."
          className="h-12 w-full rounded-xl border-border/50 bg-card/50 pl-10 text-base shadow-sm focus-visible:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => {
          const isOwner = project.owner.id === user?.id;
          const isCollaborator = Boolean(
            user && (isOwner || project.collaborators.some((entry) => entry.user.id === user.id)),
          );

          return (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                title: project.title,
                description: project.description,
                status: project.collaborators.length > 0 ? "Active" : "Recruiting",
                documentUrl: project.documentUrl,
                lead: {
                  name: project.owner.name,
                  headline: project.owner.headline,
                  avatar: project.owner.profileImageUrl,
                },
                collaborators: project.collaborators.map((entry) => ({
                  id: entry.id,
                  roleInProject: entry.roleInProject,
                  user: {
                    id: entry.user.id,
                    name: entry.user.name,
                    email: entry.user.email,
                    profileImageUrl: entry.user.profileImageUrl,
                  },
                })),
                tags: project.tags,
                isCollaborator,
                canManage: isOwner,
              }}
              isExpanded={expandedProjectId === project.id}
              inviteQuery={inviteQueries[project.id] ?? ""}
              inviteRole={inviteRoles[project.id] ?? "Collaborator"}
              inviteResults={inviteResults[project.id] ?? []}
              isSearching={searchingProjectId === project.id}
              isInviting={invitingProjectId === project.id}
              onToggleExpand={() =>
                setExpandedProjectId((current) => (current === project.id ? null : project.id))
              }
              onInviteQueryChange={(value) =>
                setInviteQueries((current) => ({ ...current, [project.id]: value }))
              }
              onInviteRoleChange={(value) =>
                setInviteRoles((current) => ({ ...current, [project.id]: value }))
              }
              onInvite={async (userId) => {
                setInvitingProjectId(project.id);
                try {
                  await api.post(`/research/projects/${project.id}/collaborators`, {
                    userId,
                    roleInProject: inviteRoles[project.id] ?? "Collaborator",
                  });
                  await loadProjects();
                  showToast({
                    title: "Collaborator invited",
                    description: "The user has been added to the research project.",
                    variant: "success",
                  });
                } catch (error) {
                  showToast({
                    title: "Invitation failed",
                    description: getApiErrorMessage(error, "Unable to add this collaborator."),
                    variant: "error",
                  });
                } finally {
                  setInvitingProjectId((current) => (current === project.id ? null : current));
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
