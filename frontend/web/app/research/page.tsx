"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { ApiResponse, PaginatedResult, ResearchProjectRecord } from "@/lib/types";
import { ProjectCard } from "@/components/features/research/project-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function ResearchPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ResearchProjectRecord[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<PaginatedResult<ResearchProjectRecord>>>("/research/projects")
      .then(({ data }) => setProjects(data.data.data.items))
      .catch(() => undefined);
  }, []);

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
        <p className="mt-2 text-muted-foreground">Collaborate on cutting-edge departmental research.</p>
      </div>

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
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              title: project.title,
              description: project.description,
              status: project.collaborators.length > 0 ? "Active" : "Recruiting",
              lead: {
                name: project.owner.name,
              },
              collaborators: project.collaborators.length,
              tags: project.tags,
              isCollaborator: Boolean(user && project.collaborators.some((entry) => entry.user.id === user.id)),
            }}
          />
        ))}
      </div>
    </div>
  );
}
