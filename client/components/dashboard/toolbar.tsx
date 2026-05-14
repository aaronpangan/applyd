"use client";

import { IconArchive, IconDownload, IconPlus, IconSearch } from "@tabler/icons-react";

import type { FilterOptions, Filters, JobPriority, JobStatus, WorkSetup } from "./types";

interface ToolbarProps {
  filters: Filters;
  filterOptions: FilterOptions | null;
  onFiltersChange: (patch: Partial<Filters>) => void;
  onAddJob: () => void;
  onExportCsv: () => void;
}

const selectClass =
  "h-8 rounded-md border-hair border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-7 bg-[right_8px_center] bg-no-repeat";

const caretSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E";

const selectStyle = {
  backgroundImage: `url("${caretSvg}")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
};

export function Toolbar({
  filters,
  filterOptions,
  onFiltersChange,
  onAddJob,
  onExportCsv,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <IconSearch
          size={14}
          stroke={1.75}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
          placeholder="Search company or position…"
          className="h-8 w-56 rounded-md border-hair border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) =>
          onFiltersChange({ status: e.target.value as JobStatus | "", page: 1 })
        }
        className={selectClass}
        style={selectStyle}
      >
        <option value="">All statuses</option>
        {(
          filterOptions?.statuses ?? [
            "bookmarked",
            "applied",
            "phone_screen",
            "tech_interview",
            "final_interview",
            "offer",
            "accepted",
            "rejected",
            "withdrawn",
          ]
        ).map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>

      {/* Priority */}
      <select
        value={filters.priority}
        onChange={(e) =>
          onFiltersChange({
            priority: e.target.value as JobPriority | "",
            page: 1,
          })
        }
        className={selectClass}
        style={selectStyle}
      >
        <option value="">All priorities</option>
        {(filterOptions?.priorities ?? ["high", "medium", "low"]).map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>

      {/* Work setup */}
      <select
        value={filters.work_setup}
        onChange={(e) =>
          onFiltersChange({
            work_setup: e.target.value as WorkSetup | "",
            page: 1,
          })
        }
        className={selectClass}
        style={selectStyle}
      >
        <option value="">All setups</option>
        {(filterOptions?.work_setups ?? ["remote", "hybrid", "onsite"]).map(
          (w) => (
            <option key={w} value={w}>
              {w.charAt(0).toUpperCase() + w.slice(1)}
            </option>
          ),
        )}
      </select>

      {/* Archive toggle */}
      <button
        type="button"
        onClick={() =>
          onFiltersChange({
            is_archived: !filters.is_archived,
            page: 1,
            status: "",
          })
        }
        className={[
          "inline-flex h-8 items-center gap-1.5 rounded-md border-hair border-border px-2.5 text-sm transition-colors",
          filters.is_archived
            ? "bg-muted text-foreground"
            : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        ].join(" ")}
      >
        <IconArchive size={14} stroke={1.75} />
        {filters.is_archived ? "Archived" : "Archive"}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export */}
      <button
        type="button"
        onClick={onExportCsv}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border-hair border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <IconDownload size={14} stroke={1.75} />
        Export CSV
      </button>

      {/* Add job */}
      <button
        type="button"
        onClick={onAddJob}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <IconPlus size={14} stroke={2} />
        Add job
      </button>
    </div>
  );
}
