// src/types/index.ts

// Base interfaces for API responses
export interface ApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

// Base user information
export interface UserBase {
  did: string;
  handle: string;
  display_name?: string;
  description?: string;
  followers_count?: number;
  follows_count?: number;
}

// Complete user information from database
export interface User extends UserBase {
  pack_ids?: string[];
  created_packs?: string[];
  handle_history?: Array<{
    oldHandle: string;
    timestamp: string;
  }>;
  deleted?: boolean;
  deleted_at?: string;
  deletion_reason?: string;
  last_updated?: string;
}

// Basic pack information
export interface PackBasic {
  rkey: string;
  name: string;
  creator: string;
  creator_did: string;
  user_count: number;
}

// Complete pack information from database
export interface StarterPack extends PackBasic {
  description?: string;
  users: string[];
  created_at: string;
  updated_at: string;
  weekly_joins: number;
  total_joins: number;
  deleted?: boolean;
  deleted_at?: string;
  deletion_reason?: string;
  status?: string;
  status_updated_at?: string;
  status_reason?: string;
  last_updated: string;
  // UI-specific fields added by API
  creator_details?: UserBase;
  members?: UserBase[];
}

// Enhanced user response from search API
export interface EnhancedUser extends UserBase {
  member_packs?: PackBasic[];
  created_packs?: PackBasic[];
}

// Stats response from API
export interface Stats {
  total_packs: number;
  total_users: number;
  avg_pack_size: number;
  updated_at: string;
}