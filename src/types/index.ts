// src/types/index.ts

export interface User {
  did: string;
  handle: string;
  display_name?: string;
  followers_count?: number;
  follows_count?: number;
  pack_ids_count?: number;
  packs?: StarterPack[];
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
  user_count: number;
//  use_count: number;
  users?: User[];
}

export interface Stats {
  total_packs: number;
  total_users: number;
  active_packs: number;
  avg_pack_size: number;
  updated_at: string;
}
