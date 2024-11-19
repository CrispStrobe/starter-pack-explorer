// src/types/index.ts

export interface User {
  did: string;
  handle: string;
  display_name?: string;
  pack_ids?: string[];
  packs?: Pack[];
}

export interface Pack {
  rkey: string;
  name: string;
  creator: string;
}

export interface StarterPack {
  rkey: string;
  name: string;
  creator: string;
  description?: string;
  users: User[];
  user_count: number;
}

export interface Stats {
  total_packs: number;
  total_users: number;
  active_packs: number;
  avg_pack_size: number;
  updated_at: string;
}
