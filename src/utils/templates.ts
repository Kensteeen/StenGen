/**
 * Pipeline templates generator for Claude Code (CLAUDE.md) and OpenCode (AGENTS.md).
 * Informs CLI agents of exact yt-dlp, SearXNG, HyperFrames, Earshot, and pyCapCut rules.
 */

export interface ManifestData {
  project_name: string;
  workspace_dir: string;
  voiceover_path: string;
  voiceover_duration_sec: number;
  style_profile: {
    preset_name: string;
    pacing_rules: string;
    avg_cut_duration_sec: number;
    color_palette: string[];
    typography: {
      title_font: string;
      subtitle_font: string;
      caption_font: string;
    };
    earshot_audio_density: string;
    aspect_ratio?: string;
  };
  scenes: Array<{
    id: string;
    scene_number: number;
    start_time: string;
    end_time: string;
    duration_sec: number;
    narration_text: string;
    visual_mode: 'archival' | 'motion_graphic';
    archival_config?: {
      search_queries: string[];
      source_priority: string;
      vlm_verification_criteria: string;
      suggested_clip_url?: string;
      timestamp_range?: string;
    };
    motion_graphic_config?: {
      prompt: string;
      style_theme: string;
    };
    sfx_cues: Array<{
      id: string;
      tag: string;
      offset_ms: number;
      volume_db: number;
      description?: string;
    }>;
  }>;
  capcut_draft_path?: string;
}

export function generateAgentsMarkdown(manifest: ManifestData): string {
  return `# AGENTS.md — StenGen Autonomous Pipeline
Project: "${manifest.project_name || 'StenGen'}"
Workspace: ${manifest.workspace_dir}
Target CapCut Drafts: ${manifest.capcut_draft_path || '~/Movies/CapCut/User Data/Projects/com.lveditor.draft/'}

## Mission
You are an autonomous video engineering agent. Your objective is to ingest \`manifest.json\`, source/verify all visual assets, render deterministic motion graphics, position Earshot SFX audio cues, and compile a fully validated CapCut Desktop draft project (\`draft_content.json\`).

---

## 1. Directory Structure Setup
Ensure the following directories exist in the workspace:
\`\`\`bash
mkdir -p assets/archival assets/motion assets/audio/voiceover assets/audio/sfx capcut_draft
\`\`\`

---

## 2. Archival Footage Sourcing (yt-dlp + SearXNG / Archive.org / Wikimedia)
For each scene where \`visual_mode == "archival"\`:
1. Use SearXNG or curl against Archive.org / Wikimedia Commons / YouTube APIs using \`archival_config.search_queries\`.
2. When downloading from YouTube or archival repositories, **NEVER** download the entire video. Always use precise timestamp section fetching via \`yt-dlp\`:
   \`\`\`bash
   yt-dlp --download-sections "*{START_TS}-{END_TS}" \\
          --force-keyframes-at-cuts \\
          -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best" \\
          --merge-output-format mp4 \\
          -o "assets/archival/{SCENE_ID}_source.mp4" \\
          "<SOURCE_URL>"
   \`\`\`
3. If source is Wikimedia or Internet Archive, fetch high-resolution master file:
   \`\`\`bash
   curl -L -o "assets/archival/{SCENE_ID}_source.mp4" "<DIRECT_MEDIA_URL>"
   \`\`\`

---

## 3. Strict VLM Visual Verification Criteria
Before accepting any archival footage into the cut, inspect keyframes using vision tools or local ffmpeg scene detection:
- Check against: \`vlm_verification_criteria\` (e.g., "Must show WWII Bismarck battleship, reject modern ships or burned-in subtitles").
- Reject if modern watermarks, UI overlays, or contemporary watercraft are present.
- If verified: save frame log to \`assets/archival/{SCENE_ID}_verified.json\`.
- If failed: execute fallback query from \`search_queries\` list.

---

## 4. HyperFrames Deterministic HTML/CSS Motion Graphics
For each scene where \`visual_mode == "motion_graphic"\`:
1. Generate a self-contained, deterministic HTML/CSS/SVG file at \`assets/motion/{SCENE_ID}_graphic.html\`.
2. Adhere strictly to the Style DNA:
   - Palette: ${manifest.style_profile?.color_palette?.join(', ') || '#0A1118, #D8B168'}
   - Fonts: ${manifest.style_profile?.typography?.title_font || 'Cinzel'}, ${manifest.style_profile?.typography?.caption_font || 'IBM Plex Mono'}
   - Resolution: 1920x1080 (16:9)
3. Set CSS animation duration equal to scene duration (\`--duration: {DURATION}s\`).
4. Render to 60fps MP4 using Puppeteer/Chromium or HyperFrames CLI:
   \`\`\`bash
   # Using HyperFrames CLI or headless chrome capture:
   hyperframes render assets/motion/{SCENE_ID}_graphic.html \\
     --output assets/motion/{SCENE_ID}_rendered.mp4 \\
     --fps 60 \\
     --duration {DURATION_SEC}
   \`\`\`

---

## 5. Earshot SFX Synchronization & Audio Ducking
For each SFX cue defined in \`sfx_cues\`:
1. Map \`tag\` (e.g. \`low_sonar_ping\`, \`ocean_ambience\`, \`paper_map_whoosh\`) to \`assets/audio/sfx/{tag}.wav\`.
2. Compute timeline start timestamp:
   \`SFX_START = SCENE_START_TIME + (offset_ms / 1000.0)\`
3. Apply audio ducking (-6dB to -10dB) under the primary voiceover track (\`${manifest.voiceover_path || 'voiceover.mp3'}\`).

---

## 6. pyCapCut Desktop Draft Generation (\`draft_content.json\`)
Assemble the complete non-linear edit into CapCut Desktop's native JSON format:
- CapCut uses **microseconds** for all timeline measurements (\`1 second = 1,000,000 us\`).
- Tracks required:
  - Track 1 (type: \`video\`): Sequenced archival MP4s and motion graphic MP4s with speed = 1.0.
  - Track 2 (type: \`audio\`): Primary documentary voiceover track.
  - Track 3 (type: \`audio\`): Earshot sound effects and ambient bed.
  - Track 4 (type: \`text\`): Subtitles / caption cards matching scene narration.
- Save output to:
  - \`capcut_draft/draft_content.json\`
  - \`capcut_draft/draft_meta_info.json\`
- Copy the finished folder into the user's CapCut Drafts directory:
  \`${manifest.capcut_draft_path || '~/Movies/CapCut/User Data/Projects/com.lveditor.draft/'}\`

---

## 7. Execution Complete Output
Print standard JSON log events line-by-line so the Studio SSE bridge displays progress:
\`\`\`json
{"event": "STEP_COMPLETE", "scene_id": "SCN_01", "stage": "VLM_VERIFY", "status": "pass", "details": "Bismarck hull verified"}
\`\`\`
`;
}

export function generateClaudeMarkdown(manifest: ManifestData): string {
  return `# CLAUDE.md — Documentary Video Assembly Directive
# Generated by StenGen for "${manifest.project_name || 'StenGen'}"

This project automates long-form documentary creation from a storyboard manifest into a CapCut Desktop draft.

## System Commands
- \`npm run build\` : Builds the storyboard UI
- \`yt-dlp --download-sections\` : Cut-accurate video section downloader
- \`hyperframes render\` : Renders HTML/CSS animations to 60fps MP4
- \`ffmpeg\` : Audio normalization and keyframe extraction

## Coding & Pipeline Standards
- **Low-Memory Priority**: Process scenes one-by-one; do not download multi-gigabyte raw video files.
- **Microsecond Timestamps**: CapCut draft format uses microseconds (e.g. 5 seconds = 5000000). Always use integer microseconds.
- **Historical Accuracy**: Strict VLM verification is non-negotiable. If archival footage fails criteria, fallback immediately.
- **Deterministic Motion Graphics**: Use clean SVG paths, CSS transforms, and \`requestAnimationFrame\`-friendly animations.

## Manifest Context
- Workspace: \`${manifest.workspace_dir}\`
- Scenes: ${manifest.scenes?.length || 0} total scenes
- Voiceover: \`${manifest.voiceover_path || 'voiceover.mp3'}\`
- Pacing Rule: ${manifest.style_profile?.pacing_rules || 'Measured cinematic rhythm'} (avg cut: ${manifest.style_profile?.avg_cut_duration_sec || 5.0}s)
- Audio Density: ${manifest.style_profile?.earshot_audio_density || 'balanced'}

Refer to \`AGENTS.md\` for exact CLI commands and \`draft_content.json\` structure.
`;
}

export const HERMES_PROMPT_TEXT =
  'Read manifest.json and AGENTS.md in the current working directory. Execute Stage 1 (yt-dlp/SearXNG + VLM check), Stage 2 (HyperFrames render), Stage 3 (Earshot SFX), and Stage 4 (pyCapCut draft injection).';

export function generateHermesPrompt(): string {
  return HERMES_PROMPT_TEXT;
}

export function generateHermesCommand(customFlags = ''): string {
  const extra = customFlags.trim() ? ` ${customFlags.trim()}` : '';
  return `hermes chat --yolo --query-file hermes_prompt.txt --toolsets "terminal,skills,web" --verbose${extra}`;
}

