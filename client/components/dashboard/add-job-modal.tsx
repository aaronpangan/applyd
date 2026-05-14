"use client";

import { useState } from "react";

import { IconX } from "@tabler/icons-react";

import type { Job, JobPriority, JobStatus, WorkSetup } from "./types";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (job: Job) => void;
}

interface FormState {
  company: string;
  position: string;
  work_setup: WorkSetup | "";
  applied_at: string;
  link: string;
  industry: string;
  location: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  email_contact: string;
  status: JobStatus;
  priority: JobPriority;
  job_description: string;
}

const empty: FormState = {
  company: "",
  position: "",
  work_setup: "",
  applied_at: "",
  link: "",
  industry: "",
  location: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "PHP",
  email_contact: "",
  status: "bookmarked",
  priority: "medium",
  job_description: "",
};

const inputClass =
  "h-8 w-full rounded-md border-hair border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const selectClass =
  "h-8 w-full rounded-md border-hair border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

export function AddJobModal({ open, onClose, onCreated }: AddJobModalProps) {
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  if (!open) return null;

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.company.trim()) errs.company = "Required";
    if (!form.position.trim()) errs.position = "Required";
    if (!form.work_setup) errs.work_setup = "Required";
    if (!form.applied_at) errs.applied_at = "Required";
    if (!form.link.trim()) errs.link = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (force = false) => {
    if (!validate()) return;
    setLoading(true);
    setDuplicateWarning(false);

    const body: Record<string, unknown> = {
      company: form.company.trim(),
      position: form.position.trim(),
      work_setup: form.work_setup,
      applied_at: form.applied_at,
      link: form.link.trim(),
      status: form.status,
      priority: form.priority,
      salary_currency: form.salary_currency || "PHP",
    };
    if (form.industry) body.industry = form.industry;
    if (form.location) body.location = form.location;
    if (form.salary_min) body.salary_min = Number(form.salary_min);
    if (form.salary_max) body.salary_max = Number(form.salary_max);
    if (form.email_contact) body.email_contact = form.email_contact;
    if (form.job_description) body.job_description = form.job_description;

    const url = force ? "/api/jobs?force=true" : "/api/jobs";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok && data.duplicate) {
      setDuplicateWarning(true);
      return;
    }

    if (res.ok) {
      onCreated(data as Job);
      setForm(empty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-hair border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-hair border-border px-6 py-4">
          <h2 className="text-sm font-medium">Add job</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX size={15} stroke={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {duplicateWarning && (
            <div className="mb-4 rounded-md bg-amber-100 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              A job with this company and position already exists.
              <button
                type="button"
                onClick={() => submit(true)}
                className="ml-2 font-medium underline underline-offset-2"
              >
                Add anyway
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Company */}
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>
                Company <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Acme Corp"
              />
              {errors.company && (
                <p className="mt-1 text-[11px] text-destructive">{errors.company}</p>
              )}
            </div>

            {/* Position */}
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>
                Position <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="e.g. Frontend Engineer"
              />
              {errors.position && (
                <p className="mt-1 text-[11px] text-destructive">{errors.position}</p>
              )}
            </div>

            {/* Work setup */}
            <div>
              <label className={labelClass}>
                Work setup <span className="text-destructive">*</span>
              </label>
              <select
                className={selectClass}
                value={form.work_setup}
                onChange={(e) => set("work_setup", e.target.value)}
              >
                <option value="">Select…</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
              {errors.work_setup && (
                <p className="mt-1 text-[11px] text-destructive">{errors.work_setup}</p>
              )}
            </div>

            {/* Applied at */}
            <div>
              <label className={labelClass}>
                Applied date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={form.applied_at}
                onChange={(e) => set("applied_at", e.target.value)}
              />
              {errors.applied_at && (
                <p className="mt-1 text-[11px] text-destructive">{errors.applied_at}</p>
              )}
            </div>

            {/* Link */}
            <div className="col-span-2">
              <label className={labelClass}>
                Job posting URL <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
                placeholder="https://…"
              />
              {errors.link && (
                <p className="mt-1 text-[11px] text-destructive">{errors.link}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
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

            {/* Priority */}
            <div>
              <label className={labelClass}>Priority</label>
              <select
                className={selectClass}
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className={labelClass}>Industry</label>
              <input
                className={inputClass}
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="e.g. Technology"
              />
            </div>

            {/* Location */}
            <div>
              <label className={labelClass}>Location</label>
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Manila, PH"
              />
            </div>

            {/* Salary */}
            <div>
              <label className={labelClass}>Salary min</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Salary max</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Currency */}
            <div>
              <label className={labelClass}>Currency</label>
              <input
                className={inputClass}
                value={form.salary_currency}
                maxLength={8}
                onChange={(e) => set("salary_currency", e.target.value)}
                placeholder="PHP"
              />
            </div>

            {/* Email contact */}
            <div>
              <label className={labelClass}>Recruiter email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email_contact}
                onChange={(e) => set("email_contact", e.target.value)}
                placeholder="recruiter@company.com"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className={labelClass}>Job description</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border-hair border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.job_description}
                onChange={(e) => set("job_description", e.target.value)}
                placeholder="Paste or type the job description…"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t-hair border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={loading}
            className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add job"}
          </button>
        </div>
      </div>
    </div>
  );
}
