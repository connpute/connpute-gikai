// ── 議員 (Member) ──

export interface MemberAdapter {
  speak(prompt: string, systemPrompt: string, temperature: number): Promise<string>;
}

export interface MemberIdentity {
  name: string;
  partyName: string;
  adapterName: string;
  model: string;
}

export interface Member {
  identity: MemberIdentity;
  adapter: MemberAdapter;
}

// ── 党 (Party) ──

export interface Party {
  name: string;
  manifesto: string; // system prompt
  members: Member[];
}

// ── 発言 (Speech) ──

export interface Speech {
  member: MemberIdentity;
  content: string;
  round: string;
  timestamp: Date;
}

export interface AnonymizedSpeech {
  id: string; // e.g. "議員X"
  content: string;
  round: string;
}

// ── 投票 (Vote) ──

export type VoteMethod = 'ranked' | 'simple_majority' | 'consensus';

export interface Vote {
  member: MemberIdentity;
  vote: string;
  ranking?: string[];
  reason: string;
  conditions?: string;
}

export interface VoteResult {
  method: VoteMethod;
  winner: string;
  details: VoteTally[];
  castingVote?: boolean; // 議長の決定票が使われたか
}

export interface VoteTally {
  option: string;
  count: number;
  voters: string[];
}

// ── 議事録 (Minutes) ──

export interface RoundRecord {
  round: string;
  speeches: Speech[];
  summary: string; // 議長による要約
  issues: string[]; // 争点
}

export interface ProvisionalVote {
  member: string;
  choice: string;
}

export interface OpinionShift {
  member: string;
  from: string;
  to: string;
  reason: string;
}

export interface SessionMinutes {
  date: Date;
  agenda: string;
  decisionRequired: string;
  criteria: string[];
  context?: string;
  parties: { name: string; memberCount: number }[];
  rounds: RoundRecord[];
  provisionalVotes: ProvisionalVote[];
  voteResult: VoteResult;
  opinionShifts: OpinionShift[];
  finalDecision: string;
  rationale: string;
  conditions: string[];
}

// ── 議題 (Agenda) ──

export interface Agenda {
  topic: string;
  decisionRequired: string;
  criteria: string[];
  context?: string;
  options?: string[];
}

// ── 設定 (Config) ──

export interface ParliamentConfig {
  speaker: SpeakerConfig;
  parties: PartyConfig[];
  protocol: ProtocolConfig;
}

export interface SpeakerConfig {
  engine: string;
  model: string;
}

export interface PartyConfig {
  name: string;
  manifesto: string; // filename
  members: MemberConfig[];
}

export interface MemberConfig {
  name: string;
  adapter: string;
  model: string;
}

export interface ProtocolConfig {
  rounds: number;
  vote_method: VoteMethod;
  max_tokens_per_speech: number;
  language: string;
  contentiousness?: ContentiousnessConfig;
  sycophancy_prevention?: SycophancyPreventionConfig;
}

export interface ContentiousnessConfig {
  first_reading: number;
  second_reading: number;
  amendment: number;
}

export interface SycophancyPreventionConfig {
  anti_conformity_prompt: boolean;
  anonymize_sources: boolean;
  protect_minority_opinion: boolean;
  measure_opinion_shift: boolean;
}

export interface AdapterConfig {
  base_url: string;
  api_key_env: string | null;
  default_temperature: number;
  models: Record<string, ModelConfig>;
}

export interface ModelConfig {
  id: string;
  max_tokens: number;
}

export interface ModelsConfig {
  adapters: Record<string, AdapterConfig>;
}
