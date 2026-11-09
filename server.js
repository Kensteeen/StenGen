/**
 * StenGen - Local Backend Bridge (server.js)
 * Standalone low-RAM local bridge running on port 3001 using standard Node.js:
 * fs, path, child_process.spawn, express.
 *
 * Can be run standalone: `node server.js`
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let activeAgentProcess = null;
let activeRunState = {
  isRunning: false,
  agentType: '',
  startedAt: 0,
  activeSceneId: '',
  completedCount: 0,
  totalCount: 0,
  statusMessage: 'Idle'
};

const sseClients = new Set();
const recentLogs = [];

function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function pushLog(log) {
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ...log
  };
  recentLogs.push(entry);
  if (recentLogs.length > 500) recentLogs.shift();
  broadcastSSE('log', entry);
}

// ----------------------------------------------------
// EMBEDDED TEMPLATE GENERATOR FOR CLAUDE.md / AGENTS.md
// ----------------------------------------------------
function generateAgentsMarkdown(manifest) {
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
Before accepting any archival footage into the cut, inspect keyframes using vision tools:
- Check against: \`vlm_verification_criteria\` (e.g., "Must show WWII Bismarck battleship, reject modern ships or burned-in subtitles").
- Reject if modern watermarks, UI overlays, or contemporary watercraft are present.
- If verified: save frame log to \`assets/archival/{SCENE_ID}_verified.json\`.
- If failed: execute fallback query from \`search_queries\` list.

---

## 4. HyperFrames Deterministic HTML/CSS Motion Graphics
For each scene where \`visual_mode == "motion_graphic"\`:
1. Generate a self-contained, deterministic HTML/CSS/SVG file at \`assets/motion/{SCENE_ID}_graphic.html\`.
2. Adhere strictly to the Style DNA:
   - Palette: ${(manifest.style_profile?.color_palette || []).join(', ')}
   - Fonts: ${manifest.style_profile?.typography?.title_font || 'Cinzel'}, ${manifest.style_profile?.typography?.caption_font || 'monospace'}
   - Resolution: 1920x1080 (16:9)
3. Set CSS animation duration equal to scene duration (\`--duration: {DURATION}s\`).
4. Render to 60fps MP4 using Puppeteer/Chromium or HyperFrames CLI:
   \`\`\`bash
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
`;
}

function generateClaudeMarkdown(manifest) {
  return `# CLAUDE.md — Documentary Video Assembly Directive
# Generated by StenGen for "${manifest.project_name || 'StenGen'}"

This project automates long-form documentary creation from a storyboard manifest into a CapCut Desktop draft.

## System Commands
- \`yt-dlp --download-sections\` : Cut-accurate video section downloader
- \`hyperframes render\` : Renders HTML/CSS animations to 60fps MP4
- \`ffmpeg\` : Audio normalization and keyframe extraction

## Pipeline Directives
- **Low-Memory Priority**: Process scenes sequentially; avoid loading large video files into memory.
- **Microsecond Timestamps**: CapCut draft format requires microsecond integer units (1 sec = 1,000,000 us).
- **Historical Accuracy**: Strict VLM verification is enforced for all archival queries.
- Refer to \`AGENTS.md\` for exact CLI recipes and \`draft_content.json\` specs.
`;
}

const HERMES_PROMPT_TEXT =
  'Read manifest.json and AGENTS.md in the current working directory. Execute Stage 1 (yt-dlp/SearXNG + VLM check), Stage 2 (HyperFrames render), Stage 3 (Earshot SFX), and Stage 4 (pyCapCut draft injection).';

function resolveWorkspace(dirPath) {
  if (!dirPath || dirPath.trim() === '') {
    return path.join(process.cwd(), 'workspace_project');
  }
  let cleaned = dirPath.trim();
  if (cleaned.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || process.cwd();
    cleaned = path.join(home, cleaned.slice(1));
  }
  return path.resolve(cleaned);
}

// ----------------------------------------------------
// 1. POST /api/save-manifest
// ----------------------------------------------------
app.post('/api/save-manifest', (req, res) => {
  try {
    const { manifest } = req.body;
    if (!manifest) return res.status(400).json({ error: 'Manifest required' });

    let targetDir = resolveWorkspace(manifest.workspace_dir);
    try {
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    } catch {
      targetDir = path.join(process.cwd(), 'local_workspace');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), generateAgentsMarkdown(manifest), 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), generateClaudeMarkdown(manifest), 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'hermes_prompt.txt'), HERMES_PROMPT_TEXT, 'utf-8');

    const subdirs = ['assets/archival', 'assets/motion', 'assets/audio/voiceover', 'assets/audio/sfx', 'capcut_draft'];
    for (const sub of subdirs) {
      const p = path.join(targetDir, sub);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    }

    pushLog({
      type: 'INFO',
      message: `[server.js] Manifest, AGENTS.md, CLAUDE.md & hermes_prompt.txt saved to ${targetDir}`
    });

    return res.json({ success: true, workspace: targetDir });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. POST /api/run-agent
// ----------------------------------------------------
app.post('/api/run-agent', (req, res) => {
  try {
    const { manifest, agentType, flags } = req.body;
    if (!manifest) return res.status(400).json({ error: 'Manifest required' });

    if (activeAgentProcess || activeRunState.isRunning) {
      return res.status(409).json({ error: 'Agent already running' });
    }

    const type = agentType || manifest.agent_config?.agent_type || 'hermes';
    const targetDir = resolveWorkspace(manifest.workspace_dir);

    activeRunState = {
      isRunning: true,
      agentType: type,
      startedAt: Date.now(),
      activeSceneId: manifest.scenes?.[0]?.id || 'SCN_01',
      completedCount: 0,
      totalCount: manifest.scenes?.length || 0,
      statusMessage: `Running ${type}...`
    };
    broadcastSSE('state', activeRunState);

    let command = '';
    let args = [];

    if (type === 'hermes') {
      const hermesPromptPath = path.join(targetDir, 'hermes_prompt.txt');
      try {
        if (!fs.existsSync(hermesPromptPath)) {
          fs.writeFileSync(hermesPromptPath, HERMES_PROMPT_TEXT, 'utf-8');
        }
      } catch {
        // Ignored
      }

      command = 'hermes';
      args = [
        'chat',
        '--yolo',
        '--query-file',
        'hermes_prompt.txt',
        '--toolsets',
        '"terminal,skills,web"',
        '--verbose'
      ];
      if (flags) args.push(...flags.split(' ').filter(Boolean));
    } else if (type === 'claude-code') {
      command = 'claude';
      args = ['-p', 'Read manifest.json and CLAUDE.md. Execute the documentary asset sourcing, HyperFrames rendering, Earshot SFX sync, and pyCapCut draft generation.', '--dangerously-skip-permissions', '--output-format', 'stream-json', '--verbose'];
      if (flags) args.push(...flags.split(' ').filter(Boolean));
    } else if (type === 'opencode-cli') {
      command = 'opencode';
      args = ['run', '--format', 'json', '--auto', 'Read manifest.json and AGENTS.md. Execute the documentary asset sourcing, HyperFrames rendering, Earshot SFX sync, and pyCapCut draft generation.'];
      if (flags) args.push(...flags.split(' ').filter(Boolean));
    } else if (type === 'opencode-server') {
      command = 'opencode';
      const serverUrl = manifest.agent_config?.server_url || 'http://localhost:4096';
      args = ['run', '--attach', serverUrl, '--format', 'json', 'Read manifest.json and AGENTS.md. Assemble documentary video.'];
    }

    try {
      const child = spawn(command, args, {
        cwd: targetDir,
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          HERMES_YOLO_MODE: '1'
        }
      });
      activeAgentProcess = child;

      child.stdout.on('data', (d) => {
        const lines = d.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const p = JSON.parse(line);
            pushLog({ type: p.type || 'RAW', message: p.message || line, scene_id: p.scene_id });
          } catch {
            pushLog({ type: 'RAW', message: line });
          }
        }
      });

      child.stderr.on('data', (d) => {
        pushLog({ type: 'ERROR', message: d.toString().trim() });
      });

      child.on('close', (code) => {
        activeAgentProcess = null;
        activeRunState.isRunning = false;
        activeRunState.statusMessage = code === 0 ? 'Agent Complete' : `Exited with code ${code}`;
        broadcastSSE('state', activeRunState);
      });
    } catch (e) {
      activeRunState.isRunning = false;
      pushLog({ type: 'ERROR', message: `Execution failed: ${e.message}` });
    }

    return res.json({ success: true, command: `${command} ${args.join(' ')}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. POST /api/stop-agent
// ----------------------------------------------------
app.post('/api/stop-agent', (req, res) => {
  if (activeAgentProcess) {
    activeAgentProcess.kill('SIGTERM');
    activeAgentProcess = null;
  }
  activeRunState.isRunning = false;
  activeRunState.statusMessage = 'Stopped';
  broadcastSSE('state', activeRunState);
  pushLog({ type: 'INFO', message: 'Agent stopped by user' });
  return res.json({ success: true });
});

// ----------------------------------------------------
// 4. SSE STREAM
// ----------------------------------------------------
app.get('/api/agent-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(': connected\n\n');
  sseClients.add(res);

  res.write(`event: state\ndata: ${JSON.stringify(activeRunState)}\n\n`);
  res.write(`event: history\ndata: ${JSON.stringify(recentLogs.slice(-30))}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.listen(PORT, () => {
  console.log(`[server.js] Lightweight Local Agent Bridge listening on port ${PORT}`);
});
