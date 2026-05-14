"use client";

import { useEffect, useState } from "react";

import {
  IconArchive,
  IconExternalLink,
  IconRestore,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { PriorityBadge, StatusBadge, WorkSetupBadge } from "./badges";
import type { Job, JobPriority, JobStatus, Note, Reminder, WorkSetup } from "./types";

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onJobUpdate: (job: Job) => void;
  onJobRemove: (id: string) => void;
}

const selectClass =
  "h-8 w-full rounded-md border-hair border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JobDetailModal({
  job,
  onClose,
  onJobUpdate,
  onJobRemove,
}: JobDetailModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);

  // Inline edit state
  const [editField, setEditField] = useState<keyof Job | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!job) return;
    setNotes([]);
    setReminders([]);
    setNoteText("");
    setReminderAt("");
    setReminderMsg("");

    Promise.all([
      fetch(`/api/jobs/${job.id}/notes`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch(`/api/jobs/${job.id}/reminders`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
    ]).then(([n, r]) => {
      setNotes(Array.isArray(n) ? n : []);
      setReminders(Array.isArray(r) ? r : []);
    });
  }, [job?.id]);

  if (!job) return null;

  const patchJob = async (patch: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated: Job = await res.json();
      onJobUpdate(updated);
    }
    setSaving(false);
    setEditField(null);
  };

  const handleArchiveToggle = async () => {
    const endpoint = job.is_archived
      ? `/api/jobs/${job.id}/restore`
      : `/api/jobs/${job.id}/archive`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok) {
      const updated: Job = await res.json();
      onJobUpdate(updated);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this job? This cannot be undone.")) return;
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      onJobRemove(job.id);
      onClose();
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    const res = await fetch(`/api/jobs/${job.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: noteText.trim() }),
    });
    if (res.ok) {
      const note: Note = await res.json();
      setNotes((prev) => [...prev, note]);
      setNoteText("");
    }
    setNoteLoading(false);
  };

  const addReminder = async () => {
    if (!reminderAt || !reminderMsg.trim()) return;
    setReminderLoading(true);
    const res = await fetch(`/api/jobs/${job.id}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        remind_at: new Date(reminderAt).toISOString(),
        message: reminderMsg.trim(),
      }),
    });
    if (res.ok) {
      const reminder: Reminder = await res.json();
      setReminders((prev) => [...prev, reminder]);
      setReminderAt("");
      setReminderMsg("");
    }
    setReminderLoading(false);
  };

  const deleteReminder = async (id: string) => {
    const res = await fetch(`/api/jobs/${job.id}/reminders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const startEdit = (field: keyof Job) => {
    setEditField(field);
    setEditValue(String(job[field] ?? ""));
  };

  const commitEdit = async () => {
    if (!editField) return;
    const value =
      editValue === "" ? null : isNaN(Number(editValue)) ? editValue : editValue;
    await patchJob({ [editField]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border-hair border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="border-b-hair border-border px-6 py-5">
          <div className="mb-1 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {job.company}
              </p>
              <h2 className="text-base font-medium leading-snug tracking-tight">
                {job.position}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {job.link && (
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconExternalLink size={13} stroke={1.75} />
                  View posting
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <IconX size={15} stroke={2} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <WorkSetupBadge workSetup={job.work_setup} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Quick-edit status row */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Status</p>
              <select
                className={selectClass}
                value={job.status}
                onChange={(e) => patchJob({ status: e.target.value as JobStatus })}
                disabled={saving}
              >
                {(
                  [
                    "bookmarked",
                    "applied",
                    "phone_screen",
                    "tech_interview",
                    "final_interview",
                    "offer",
                    "accepted",
                    "rejected",
                    "withdrawn",
                  ] as JobStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Priority</p>
              <select
                className={selectClass}
                value={job.priority}
                onChange={(e) => patchJob({ priority: e.target.value as JobPriority })}
                disabled={saving}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Work setup</p>
              <select
                className={selectClass}
                value={job.work_setup}
                onChange={(e) => patchJob({ work_setup: e.target.value as WorkSetup })}
                disabled={saving}
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
          </div>

          {/* Detail grid */}
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3">
            {(
              [
                ["Applied date", "applied_at"],
                ["Location", "location"],
                ["Industry", "industry"],
                ["Currency", "salary_currency"],
                ["Salary min", "salary_min"],
                ["Salary max", "salary_max"],
                ["Recruiter email", "email_contact"],
              ] as [string, keyof Job][]
            ).map(([label, field]) => (
              <div key={field}>
                <p className="mb-0.5 text-[11px] text-muted-foreground">{label}</p>
                {editField === field ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      className="h-7 flex-1 rounded border-hair border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditField(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={commitEdit}
                      className="h-7 rounded px-2 text-xs text-primary hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(field)}
                    className="text-left text-sm text-foreground hover:underline"
                    disabled={job.is_archived}
                  >
                    {job[field] != null ? String(job[field]) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Description */}
          {job.job_description && (
            <div className="mb-5">
              <p className="mb-1 text-[11px] text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {job.job_description}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="mb-5 border-t-hair border-border" />

          {/* Reminders */}
          <div className="mb-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Reminders
            </p>
            {reminders.length > 0 ? (
              <ul className="mb-3 space-y-2">
                {reminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">{r.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDate(r.remind_at)}
                        {r.is_sent && (
                          <span className="ml-1.5 text-green-600 dark:text-green-400">
                            · sent
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteReminder(r.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <IconTrash size={13} stroke={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No reminders set.</p>
            )}
            {!job.is_archived && (
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  className="h-8 flex-1 rounded-md border-hair border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={reminderAt}
                  min={new Date().toISOString().slice(0, 16)}
                  step={60}
                  onChange={(e) => setReminderAt(e.target.value)}
                />
                <input
                  className="h-8 flex-1 rounded-md border-hair border-border bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Reminder message"
                  value={reminderMsg}
                  onChange={(e) => setReminderMsg(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addReminder}
                  disabled={!reminderAt || !reminderMsg.trim() || reminderLoading}
                  className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mb-5 border-t-hair border-border" />

          {/* Notes */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Notes
            </p>
            {notes.length > 0 ? (
              <ul className="mb-3 space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md bg-muted px-3 py-2.5">
                    <p className="text-sm leading-relaxed">{n.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No notes yet.</p>
            )}
            {!job.is_archived && (
              <div className="flex gap-2">
                <textarea
                  className="min-h-[60px] flex-1 rounded-md border-hair border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!noteText.trim() || noteLoading}
                  className="self-end inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-hair border-border px-6 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleArchiveToggle}
              className={[
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
                job.is_archived
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/20",
              ].join(" ")}
            >
              {job.is_archived ? (
                <>
                  <IconRestore size={14} stroke={1.75} />
                  Restore
                </>
              ) : (
                <>
                  <IconArchive size={14} stroke={1.75} />
                  Archive
                </>
              )}
            </button>
            {job.is_archived && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive/10 px-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
              >
                <IconTrash size={14} stroke={1.75} />
                Delete
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
