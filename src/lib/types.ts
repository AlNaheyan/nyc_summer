// Shared domain types (mirror the DB schema in src/db/migrations/0001_init.sql).

export type Borough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "Bronx"
  | "Staten Island";

export type ModerationStatus = "allowed" | "flagged" | "blocked" | "removed";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_adult: boolean;
  is_admin: boolean;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  source: string;
  title: string;
  tags: string[];
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  borough: string | null;
  url: string;
  min_age: number | null;
  max_age: number | null;
  icon: string | null;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  match_tags: string[];
  adult_friendly: boolean;
  weight: number;
}

export interface DailyQuest {
  id: string;
  user_id: string;
  quest_template_id: string;
  quest_date: string;
  slot: number;
  completed: boolean;
  spins_used: number;
  created_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  quest_template_id: string;
  activity_id: number | null;
  photo_url: string | null;
  caption: string | null;
  is_private: boolean;
  completed_at: string;
}

export interface FeedPost {
  id: string;
  completion_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  quest_title: string;
  location_name: string | null;
  moderation_status: ModerationStatus;
  report_count: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  rule_key: string;
}
