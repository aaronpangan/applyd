import { cn } from "@/lib/utils";

import type { JobPriority, JobStatus, WorkSetup } from "./types";

const statusStyles: Record<JobStatus, string> = {
  bookmarked: "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  phone_screen: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  tech_interview: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  final_interview: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  accepted: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  withdrawn: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};

const statusLabels: Record<JobStatus, string> = {
  bookmarked: "Bookmarked",
  applied: "Applied",
  phone_screen: "Phone screen",
  tech_interview: "Tech interview",
  final_interview: "Final interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const priorityStyles: Record<JobPriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const workSetupStyles: Record<WorkSetup, string> = {
  remote: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  hybrid: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  onsite: "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
};

const pill = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={cn(pill, statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <span className={cn(pill, priorityStyles[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

export function WorkSetupBadge({ workSetup }: { workSetup: WorkSetup }) {
  return (
    <span className={cn(pill, workSetupStyles[workSetup])}>
      {workSetup.charAt(0).toUpperCase() + workSetup.slice(1)}
    </span>
  );
}
