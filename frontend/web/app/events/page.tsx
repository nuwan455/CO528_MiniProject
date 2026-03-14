"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/form-validation";
import { canCreateDepartmentEvents, isAdmin } from "@/lib/roles";
import { ApiResponse, EventRecord, PaginatedResult } from "@/lib/types";
import { EventCard } from "@/components/features/events/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuthStore } from "@/store/auth";
import { CalendarPlus, Search } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const editorCardRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [query, setQuery] = useState("");
  const [rsvpedIds, setRsvpedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventRecord | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    bannerUrl: "",
  });

  const userCanCreateEvents = canCreateDepartmentEvents(user);
  const userIsAdmin = isAdmin(user);
  const eventTargetId = searchParams.get("event");

  const loadEvents = async () => {
    const { data } = await api.get<ApiResponse<PaginatedResult<EventRecord>>>("/events?upcoming=true");
    setEvents(data.data.items);
  };

  useEffect(() => {
    loadEvents().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!eventTargetId || !events.length) {
      return;
    }

    const targetElement = document.getElementById(`event-card-${eventTargetId}`);
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    router.replace("/events", { scroll: false });
  }, [eventTargetId, events, router]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) =>
        [event.title, event.location, event.description].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [events, query],
  );

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      bannerUrl: "",
    });
    setEditingEventId(null);
  };

  const focusEventEditor = () => {
    editorCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => titleInputRef.current?.focus());
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Department Events</h1>
        <p className="mt-2 text-muted-foreground">Discover and RSVP to upcoming activities.</p>
      </div>

      {userCanCreateEvents ? (
        <Card ref={editorCardRef} className="mb-8 border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarPlus className="h-5 w-5 text-primary" />
            {editingEventId ? "Edit Event" : "Create Department Event"}
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
                    ...eventForm,
                    bannerUrl: eventForm.bannerUrl || undefined,
                    startTime: new Date(eventForm.startTime).toISOString(),
                    endTime: new Date(eventForm.endTime).toISOString(),
                  };

                  if (editingEventId) {
                    await api.patch(`/events/${editingEventId}`, payload);
                  } else {
                    await api.post("/events", payload);
                  }

                  resetEventForm();
                  await loadEvents();
                  showToast({
                    title: editingEventId ? "Event updated" : "Event published",
                    description: editingEventId
                      ? "Your event changes are now live."
                      : userIsAdmin
                        ? "The official department event is now visible to all users."
                        : "Your event is now visible to the community.",
                    variant: "success",
                  });
                } catch (error) {
                  showToast({
                    title: editingEventId ? "Event update failed" : "Event creation failed",
                    description: getApiErrorMessage(error, editingEventId ? "Unable to update this event." : "Unable to create this event."),
                    variant: "error",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Input
                ref={titleInputRef}
                value={eventForm.title}
                onChange={(e) => setEventForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Event title"
                required
              />
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm((current) => ({ ...current, location: e.target.value }))}
                placeholder="Location"
                required
              />
              <Input
                type="datetime-local"
                value={eventForm.startTime}
                onChange={(e) => setEventForm((current) => ({ ...current, startTime: e.target.value }))}
                required
              />
              <Input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={(e) => setEventForm((current) => ({ ...current, endTime: e.target.value }))}
                required
              />
              <Input
                className="md:col-span-2"
                value={eventForm.bannerUrl}
                onChange={(e) => setEventForm((current) => ({ ...current, bannerUrl: e.target.value }))}
                placeholder="Banner image URL (optional)"
              />
              <textarea
                className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
                value={eventForm.description}
                onChange={(e) => setEventForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Share agenda, audience, and what attendees should expect."
                required
              />
              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Admins can publish official announcements and department events.
                </p>
                <div className="flex items-center gap-2">
                  {editingEventId ? (
                    <Button type="button" variant="outline" onClick={resetEventForm}>
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editingEventId ? "Saving..." : "Publishing...") : editingEventId ? "Save Changes" : "Publish Event"}
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
              Students and alumni can browse and RSVP to events here. Event publishing is reserved for admins.
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
          placeholder="Search events by name, location, or type..."
          className="h-12 w-full rounded-xl border-border/50 bg-card/50 pl-10 text-base shadow-sm focus-visible:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div key={event.id} id={`event-card-${event.id}`}>
            <EventCard
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
                actionLabel: userIsAdmin
                  ? "Admin RSVP Optional"
                  : rsvpedIds.includes(event.id)
                    ? "Update RSVP"
                    : "RSVP Now",
                helperText: userIsAdmin
                  ? "Admins publish and oversee official events. RSVP is optional for administrative accounts."
                  : "Students and alumni can RSVP to participate in department activities.",
                canManage: Boolean(user && user.role === "ADMIN"),
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
              onEdit={() => {
                setEditingEventId(event.id);
                setEventForm({
                  title: event.title,
                  description: event.description,
                  location: event.location,
                  startTime: format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm"),
                  endTime: format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm"),
                  bannerUrl: event.bannerUrl ?? "",
                });
                focusEventEditor();
              }}
              onDelete={() => setEventToDelete(event)}
              isDeleting={deletingEventId === event.id}
            />
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(eventToDelete)}
        title="Delete event?"
        description={
          eventToDelete
            ? `This will permanently remove "${eventToDelete.title}" and its RSVP activity from the platform. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Event"
        isConfirming={Boolean(eventToDelete && deletingEventId === eventToDelete.id)}
        onCancel={() => setEventToDelete(null)}
        onConfirm={async () => {
          if (!eventToDelete) {
            return;
          }

          setDeletingEventId(eventToDelete.id);
          try {
            await api.delete(`/events/${eventToDelete.id}`);
            if (editingEventId === eventToDelete.id) {
              resetEventForm();
            }
            await loadEvents();
            showToast({ title: "Event deleted", description: "The event has been removed.", variant: "success" });
            setEventToDelete(null);
          } catch (error) {
            showToast({ title: "Delete failed", description: getApiErrorMessage(error, "Unable to delete this event."), variant: "error" });
          } finally {
            setDeletingEventId((current) => (current === eventToDelete.id ? null : current));
          }
        }}
      />
    </div>
  );
}
