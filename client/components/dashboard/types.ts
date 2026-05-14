export type JobStatus =
  | "bookmarked"
  | "applied"
  | "phone_screen"
  | "tech_interview"
  | "final_interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type JobPriority = "low" | "medium" | "high";
export type WorkSetup = "remote" | "hybrid" | "onsite";

export interface Job {
  id: string;
  user_id: string;
  company: string;
  position: string;
  industry: string | null;
  location: string | null;
  work_setup: WorkSetup;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  email_contact: string | null;
  link: string;
  job_description: string | null;
  status: JobStatus;
  priority: JobPriority;
  applied_at: string;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobsResponse {
  items: Job[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DashboardStats {
  total_active: number;
  by_status: { status: JobStatus; count: number }[];
  by_priority: { priority: JobPriority; count: number }[];
  by_work_setup: { work_setup: WorkSetup; count: number }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  job_id: string;
  user_id: string;
  remind_at: string;
  message: string;
  is_sent: boolean;
  created_at: string;
}

export interface FilterOptions {
  statuses: JobStatus[];
  priorities: JobPriority[];
  work_setups: WorkSetup[];
  companies: string[];
  locations: string[];
  periods: { year: number; month: number }[];
}

export interface Filters {
  status: string;
  priority: string;
  work_setup: string;
  search: string;
  is_archived: boolean;
  page: number;
}
