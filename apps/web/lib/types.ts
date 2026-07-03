export type LeadState = "PENDING" | "REACHED_OUT";

export type LeadRead = {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  resume_filename: string | null;
  resume_url: string | null;
  state: LeadState;
  created_at: string;
  updated_at: string;
  reached_out_at: string | null;
  reached_out_by: string | null;
  notification_sent_at: string | null;
};
