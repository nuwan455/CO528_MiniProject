import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { resolveApiAssetUrl } from "@/lib/api";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: number;
    image?: string | null;
    isRSVP?: boolean;
    host: string;
    actionLabel?: string;
    actionDisabled?: boolean;
    helperText?: string;
    canManage?: boolean;
  };
  onRsvp?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function EventCard({ event, onRsvp, onEdit, onDelete, isDeleting = false }: EventCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {event.image ? (
          <img
            src={resolveApiAssetUrl(event.image)}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <Badge variant="secondary" className="border-primary/20 bg-primary/20 text-primary backdrop-blur-md">
            {event.host}
          </Badge>
          {event.isRSVP ? <Badge className="border-none bg-emerald-500 text-white shadow-md">Going</Badge> : null}
        </div>
      </div>
      <CardHeader className="pb-2 pt-4">
        <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
          <span className="font-medium text-foreground/80">{event.date}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary/70" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0 text-primary/70" />
          <span>{event.attendees} responses</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <Button
            type="button"
            className="w-full font-medium tracking-wide"
            variant={event.isRSVP ? "outline" : "default"}
            onClick={onRsvp}
            disabled={event.actionDisabled}
          >
            {event.actionLabel ?? (event.isRSVP ? "Update RSVP" : "RSVP Now")}
          </Button>
          {event.canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ) : null}
          {event.helperText ? <p className="text-xs text-muted-foreground">{event.helperText}</p> : null}
        </div>
      </CardFooter>
    </Card>
  );
}
