"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { ApiResponse, EventRecord, PaginatedResult } from "@/lib/types";
import { EventCard } from "@/components/features/events/event-card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Search } from "lucide-react";

export default function EventsPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [query, setQuery] = useState("");
  const [rsvpedIds, setRsvpedIds] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<ApiResponse<PaginatedResult<EventRecord>>>("/events?upcoming=true")
      .then(({ data }) => setEvents(data.data.data.items))
      .catch(() => undefined);
  }, []);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) =>
        [event.title, event.location, event.description].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [events, query],
  );

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Department Events</h1>
        <p className="mt-2 text-muted-foreground">Discover and RSVP to upcoming activities.</p>
      </div>

      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by name, location, or type..."
          className="h-12 w-full rounded-xl border-border/50 bg-card/50 pl-10 text-base shadow-sm focus-visible:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={{
              id: event.id,
              title: event.title,
              date: format(new Date(event.startTime), "PPP"),
              time: `${format(new Date(event.startTime), "p")} - ${format(new Date(event.endTime), "p")}`,
              location: event.location,
              attendees: event._count.rsvps,
              image: event.bannerUrl,
              isRSVP: rsvpedIds.includes(event.id),
              host: event.createdBy.name,
            }}
            onRsvp={async () => {
              try {
                await api.post(`/events/${event.id}/rsvp`, { status: "GOING" });
                setRsvpedIds((prev) => (prev.includes(event.id) ? prev : [...prev, event.id]));
                showToast({ title: "RSVP saved", description: "You are marked as going.", variant: "success" });
              } catch (error) {
                showToast({ title: "RSVP failed", description: getApiErrorMessage(error, "Unable to save your RSVP."), variant: "error" });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
