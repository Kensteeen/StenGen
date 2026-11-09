export interface SFXCue {
  id: string;
  tag: string;
  offset_ms: number; // e.g. +120ms or -200ms relative to cut
  volume_db: number;
  description?: string;
}

export interface ArchivalConfig {
  search_queries: string[];
  source_priority: 'all' | 'wikimedia' | 'archive_org' | 'youtube';
  vlm_verification_criteria: string;
  suggested_clip_url?: string;
  timestamp_range?: string;
}

export interface MotionGraphicConfig {
  prompt: string;
  style_theme: string;
  preview_html?: string;
}

export interface Scene {
  id: string;
  scene_number: number;
  start_time: string; // e.g. "00:00.00"
  end_time: string; // e.g. "00:07.50"
  duration_sec: number;
  narration_text: string;
  visual_mode: 'archival' | 'motion_graphic';
  archival_config?: ArchivalConfig;
  motion_graphic_config?: MotionGraphicConfig;
  sfx_cues: SFXCue[];
}

export interface StyleProfile {
  preset_name: string;
  pacing_rules: string;
  avg_cut_duration_sec: number;
  color_palette: string[];
  typography: {
    title_font: string;
    subtitle_font: string;
    caption_font: string;
    callout_font?: string;
  };
  earshot_audio_density: 'sparse' | 'balanced' | 'dense';
  aspect_ratio?: '16:9' | '9:16';
  color_grading_lut?: string;
}

export interface AgentConfig {
  agent_type: 'hermes' | 'claude-code' | 'opencode-cli' | 'opencode-server';
  custom_flags?: string;
  server_url?: string;
  capcut_draft_path?: string;
}

export interface ProjectManifest {
  project_name: string;
  workspace_dir: string;
  voiceover_path: string;
  voiceover_duration_sec: number;
  reference_youtube_url: string;
  style_profile: StyleProfile;
  scenes: Scene[];
  agent_config: AgentConfig;
  capcut_draft_path: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentLogEvent {
  id: string;
  timestamp: string;
  type: 'INFO' | 'DOWNLOAD' | 'VLM_VERIFY' | 'HYPERFRAMES' | 'EARSHOT' | 'PYCAPCUT' | 'SUCCESS' | 'ERROR' | 'RAW';
  scene_id?: string;
  message: string;
  meta?: Record<string, any>;
  status?: 'pending' | 'running' | 'success' | 'failed';
}

export interface AgentRunState {
  isRunning: boolean;
  agentType: string;
  startTime?: number;
  activeSceneId?: string;
  completedScenesCount: number;
  totalScenesCount: number;
  completedCount?: number;
  totalCount?: number;
  statusMessage: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  avgCutDuration: number;
  earshotDensity: 'sparse' | 'balanced' | 'dense';
  palette: string[];
  pacingRules: string;
  typography: {
    title_font: string;
    subtitle_font: string;
    caption_font: string;
  };
  sampleScript: string;
}
