import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, FileText, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    lead: {
      name: string;
      avatar?: string;
    };
    collaborators: number;
    tags: string[];
    isCollaborator?: boolean;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md hover:border-primary/50 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 font-medium ${
              project.status === "Active"
                ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                : "border-amber-500/50 text-amber-500 bg-amber-500/10"
            }`}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4 space-y-6">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {project.description}
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarImage src={project.lead.avatar} alt={project.lead.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {project.lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Lead Researcher</span>
              <span className="text-sm font-medium text-foreground">{project.lead.name}</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border/50" />
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary/70" />
            <span>{project.collaborators}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80 font-normal text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0 border-t border-border/50 bg-muted/10 px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2 -ml-2">
          <FileText className="h-4 w-4" />
          Details
        </Button>
        <Button size="sm" variant={project.isCollaborator ? "secondary" : "default"} className="gap-2 font-medium">
          {project.isCollaborator ? "Manage" : "Join Project"}
          {!project.isCollaborator && <ExternalLink className="h-3 w-3" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
