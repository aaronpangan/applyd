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
      <div className="overflow-hidden rounded-lg border-hair border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-hair border-border bg-muted/50">
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="size-3.5 rounded border-border accent-foreground"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Company
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Position
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Priority
              </th>
              <th className="hidden px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground md:table-cell">
                Setup
              </th>
              <th className="hidden px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground sm:table-cell">
                Applied
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(PAGE_SIZE)].map((_, i) => (
                <tr key={i} className="border-b-hair border-border last:border-0">
                  <td className="px-3 py-3" />
                  {[...Array(6)].map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  {isArchived
                    ? "No archived jobs."
                    : "No jobs yet. Add your first application."}
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => onRowClick(job)}
                  className="cursor-pointer border-b-hair border-border transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td
                    className="px-3 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={(e) => onSelectRow(job.id, e.target.checked)}
                      className="size-3.5 rounded border-border accent-foreground"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium">{job.company}</td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-muted-foreground">
                    {job.position}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={job.priority} />
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <WorkSetupBadge workSetup={job.work_setup} />
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex size-7 items-center justify-center rounded-md border-hair border-border bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronLeft size={13} stroke={2} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => onPageChange(i + 1)}
                className={[
                  "inline-flex size-7 items-center justify-center rounded-md text-xs transition-colors",
                  page === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "border-hair border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex size-7 items-center justify-center rounded-md border-hair border-border bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <IconChevronRight size={13} stroke={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
