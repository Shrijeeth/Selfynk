export type InputMode = "journal" | "pulse" | "debrief" | "network" | "review"

export type Emotion = "energized" | "neutral" | "drained"

export interface InputEntry {
  id?: number
  mode: InputMode
  content: string
  context_tags: string[]
  emotion?: Emotion | null
  alignment_score?: number | null
  created_at: string
  updated_at: string
  is_analyzed: boolean
  analysis_id?: number | null
}

export interface Analysis {
  id?: number
  entry_id: number
  themes: string[]
  skills_detected: string[]
  values_detected: string[]
  tone?: string | null
  perception_signals: string[]
  raw_output?: string | null
  created_at: string
}

export interface BrandDNA {
  id?: number
  positioning: string
  niche: string
  voice: string
  strengths: string[]
  content_pillars: string[]
  credibility_score?: number | null
  gap_summary?: string | null
  entries_analyzed: number
  computed_at: string
}

export type ContentPlatform =
  | "linkedin_post"
  | "twitter_thread"
  | "bio_short"
  | "bio_long"
  | "elevator_pitch_30s"
  | "elevator_pitch_60s"

export interface GeneratedContent {
  id?: number
  source_entry_id?: number | null
  platform: ContentPlatform
  content: string
  status: string
  created_at: string
}

export interface CredibilityReport {
  id?: number
  week_of: string
  alignment_score: number
  aligned_moments: string[]
  misaligned_moments: string[]
  values_checked: string[]
  generated_at: string
}

export interface DesiredBrandStatement {
  id?: number
  legacy_words: string[]
  desired_description: string
  reverse_engineered_actions: string[]
  computed_at: string
  version: number
}

export type NetworkContactType = "decision_maker" | "info_source" | "supporter"

export interface NetworkLog {
  id?: number
  person_name: string
  contact_type: NetworkContactType
  context?: string | null
  value_given?: string | null
  value_received?: string | null
  follow_up_needed: boolean
  logged_at: string
}

export interface PerceptionReport {
  id?: number
  self_description_summary: string
  perceived_description: string
  gap_analysis: string
  entries_analyzed: number
  generated_at: string
}

export interface ValueItem {
  id?: number
  value_name: string
  personal_context: string
  declared_at: string
}

export interface VoiceSample {
  id?: number
  content: string
  source_type: string
  indexed_at: string
}
