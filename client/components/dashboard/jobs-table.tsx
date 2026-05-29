"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { PriorityBadge, StatusBadge, WorkSetupBadge } from "./badges";
import type { Job } from "./types";

const PAGE_SIZE = 6;

interface JobsTableProps {
  jobs: Job[];
  total: number;
  totalPages: number;
  page: number;
  loading: boolean;
  isArchived: boolean;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onRowClick: (job: Job) => void;
  onPageChange: (page: number) => void;
}

export function JobsTable({
  jobs,
  total,
  totalPages,
  page,
  loading,
  isArchived,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onRowClick,
  onPageChange,
}: JobsTableProps) {
  const allSelected = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id));
  const someSelected = jobs.some((j) => selectedIds.has(j.id));

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="size-3.5 rounded border-border accent-indigo-500"
                />
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Company
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Position
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Priority
              </th>
              <th className="hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground md:table-cell">
                Setup
              </th>
              <th className="hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:table-cell">
                Applied
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(PAGE_SIZE)].map((_, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-4" />
                  {[...Array(6)].map((__, j) => (
                    <td key={j} className="px-3 py-4">
                      <div className="h-4 animate-pulse rounded-md bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground/40"
                    >
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <path d="M12 11h4" />
                      <path d="M12 16h4" />
                      <path d="M8 11h.01" />
                      <path d="M8 16h.01" />
                    </svg>
                    <span className="text-sm text-muted-foreground">
                      {isArchived
                        ? "No archived jobs."
                        : "No jobs yet. Add your first application."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => onRowClick(job)}
                  className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-accent/40 dark:hover:bg-accent/20"
                >
                  <td
                    className="px-3 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={(e) => onSelectRow(job.id, e.target.checked)}
                      className="size-3.5 rounded border-border accent-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70">
                        {job.company.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">{job.company}</span>
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-4 text-[13px] text-muted-foreground">
                    {job.position}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-3 py-4">
                    <PriorityBadge priority={job.priority} />
                  </td>
                  <td className="hidden px-3 py-4 md:table-cell">
                    <WorkSetupBadge workSetup={job.work_setup} />
                  </td>
                  <td className="hidden px-3 py-4 text-[13px] text-muted-foreground sm:table-cell">
                    {job.applied_at}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronLeft size={13} stroke={2} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => onPageChange(i + 1)}
                className={[
                  "inline-flex size-7 items-center justify-center rounded-lg text-xs transition-colors",
                  page === i + 1
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "border border-border/70 bg-background hover:bg-muted",
                ].join(" ")}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronRight size={13} stroke={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
