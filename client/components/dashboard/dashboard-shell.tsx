"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { AddJobModal } from "./add-job-modal";
import { BulkActionBar } from "./bulk-action-bar";
import { DashboardNavbar } from "./dashboard-navbar";
import { JobDetailModal } from "./job-detail-modal";
import { JobsTable } from "./jobs-table";
import { StatCards } from "./stat-cards";
import { Toolbar } from "./toolbar";
import type {
  DashboardStats,
  FilterOptions,
  Filters,
  Job,
  JobStatus,
  JobsResponse,
  User,
} from "./types";

const PAGE_LIMIT = 6;

export function DashboardShell() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // isPending replaces manual jobsLoading state — React 19 async transitions
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<Filters>({
    status: "",
    priority: "",
    work_setup: "",
    search: "",
    is_archived: false,
    page: 1,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Auth check + initial data
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          router.push("/");
          return null;
        }
        return r.json();
      })
      .then((u) => u && setUser(u));

    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data));

    fetch("/api/jobs/filter-options", { credentials: "include" })
      .then((r) => r.json())
      .then(setFilterOptions);
  }, [router]);

  const fetchJobs = useCallback(async (f: Filters) => {
    const params = new URLSearchParams();
    if (f.status) params.set("status", f.status);
    if (f.priority) params.set("priority", f.priority);
    if (f.work_setup) params.set("work_setup", f.work_setup);
    if (f.search) params.set("search", f.search);
    params.set("is_archived", String(f.is_archived));
    params.set("page", String(f.page));
    params.set("limit", String(PAGE_LIMIT));

    const res = await fetch(`/api/jobs?${params}`, { credentials: "include" });
    if (res.ok) {
      const data: JobsResponse = await res.json();
      setJobs(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    }
    setSelectedIds(new Set());
  }, []);

  // Wrap in startTransition so React 19 tracks the async loading via isPending
  // and never calls setState synchronously during the effect commit
  useEffect(() => {
    startTransition(async () => {
      await fetchJobs(filters);
    });
    // fetchJobs is stable (useCallback []) — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const patchFilters = (patch: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const handleStatClick = (status: JobStatus | "") => {
    patchFilters({ status, page: 1, is_archived: false });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(jobs.map((j) => j.id)) : new Set());
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const refreshStats = () =>
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data));

  const handleBulkArchive = async () => {
    const res = await fetch("/api/jobs/bulk-archive", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ job_ids: [...selectedIds] }),
    });
    if (res.ok) {
      startTransition(async () => {
        await fetchJobs(filters);
      });
      refreshStats();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.size} job(s)? This cannot be undone.`))
      return;
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch(`/api/jobs/${id}`, { method: "DELETE", credentials: "include" }),
      ),
    );
    startTransition(async () => {
      await fetchJobs(filters);
    });
  };

  const handleJobUpdate = (updated: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setDetailJob(updated);
    refreshStats();
  };

  const handleJobRemove = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((t) => t - 1);
    refreshStats();
  };

  const handleJobCreated = (_job: Job) => {
    startTransition(async () => {
      await fetchJobs(filters);
    });
    refreshStats();
  };

  const handleExportCsv = () => {
    window.open("/api/jobs/export/csv", "_blank");
  };

  return (
    <>
      <DashboardNavbar user={user} />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-8 py-8">
        <div className="flex flex-col gap-6">
          <StatCards
            stats={stats}
            activeFilter={filters.status}
            onFilterClick={handleStatClick}
          />

          <Toolbar
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={patchFilters}
            onAddJob={() => setIsAddOpen(true)}
            onExportCsv={handleExportCsv}
          />

          {selectedIds.size > 0 && (
            <BulkActionBar
              count={selectedIds.size}
              isArchived={filters.is_archived}
              onArchive={handleBulkArchive}
              onDelete={handleBulkDelete}
              onClear={() => setSelectedIds(new Set())}
            />
          )}

          <JobsTable
            jobs={jobs}
            total={total}
            totalPages={totalPages}
            page={filters.page}
            loading={isPending}
            isArchived={filters.is_archived}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onRowClick={setDetailJob}
            onPageChange={(p) => patchFilters({ page: p })}
          />
        </div>
      </main>

      <JobDetailModal
        job={detailJob}
        onClose={() => setDetailJob(null)}
        onJobUpdate={handleJobUpdate}
        onJobRemove={handleJobRemove}
      />

      <AddJobModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={handleJobCreated}
      />
    </>
  );
}
