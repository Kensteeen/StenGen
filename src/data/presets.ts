import { StylePreset, ProjectManifest } from '../types/documentary';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'naval-history-archival',
    name: 'Naval History Archival',
    description: 'Measured pacing, authentic 35mm monochrome or sepia grain, cartography diagrams, and maritime sound design.',
    avgCutDuration: 5.5,
    earshotDensity: 'balanced',
    palette: ['#0A1118', '#1C2E3D', '#7B8D99', '#D8B168', '#F2E8D5'],
    pacingRules: 'Measured and deliberate. Hold on key historical documents and archival photographs for at least 4.5 seconds. Punctuate dramatic turns with crisp cuts.',
    typography: {
      title_font: 'Cinzel',
      subtitle_font: 'Cormorant Garamond',
      caption_font: 'JetBrains Mono',
    },
    sampleScript: ''
  },
  {
    id: 'dark-mode-data',
    name: 'Dark-Mode Data Documentary',
    description: 'Kinetic technological or financial exposés with high-contrast charts, terminal readouts, and clean sub-bass SFX.',
    avgCutDuration: 3.2,
    earshotDensity: 'dense',
    palette: ['#090D14', '#121F2F', '#38BDF8', '#6366F1', '#F8FAFC'],
    pacingRules: 'Rapid, analytical, and rhythmic. Cuts align with data spikes and key metrics. Visuals alternate between archival clips and animated HTML/CSS charts.',
    typography: {
      title_font: 'Plus Jakarta Sans',
      subtitle_font: 'Public Sans',
      caption_font: 'JetBrains Mono',
    },
    sampleScript: ''
  },
  {
    id: 'fast-paced-investigation',
    name: 'Fast-Paced Investigation',
    description: 'Declassified documents, timeline reconstructions, highlighted evidence callouts, and tactile analog transitions.',
    avgCutDuration: 2.8,
    earshotDensity: 'dense',
    palette: ['#111318', '#1E232D', '#E11D48', '#F59E0B', '#F1F5F9'],
    pacingRules: 'Urgent and investigative. Quick focal zooms on documents, timestamps, and archival records. Cut cleanly on revelatory statements.',
    typography: {
      title_font: 'Barlow Condensed',
      subtitle_font: 'Public Sans',
      caption_font: 'JetBrains Mono',
    },
    sampleScript: ''
  },
  {
    id: 'cold-war-aerospace',
    name: 'Cold War Aerospace & Tech',
    description: 'Declassified reconnaissance, schematic blueprints, radar telemetry tints, and vintage analog audio tones.',
    avgCutDuration: 4.8,
    earshotDensity: 'sparse',
    palette: ['#080C0E', '#162326', '#10B981', '#64748B', '#E2E8F0'],
    pacingRules: 'Atmospheric tension building into high-velocity sequences. Wide archival shots contrasted with technical blueprint overlays.',
    typography: {
      title_font: 'Outfit',
      subtitle_font: 'Public Sans',
      caption_font: 'JetBrains Mono',
    },
    sampleScript: ''
  }
];

export const INITIAL_MANIFEST: ProjectManifest = {
  project_name: 'StenGen',
  workspace_dir: '',
  voiceover_path: '',
  voiceover_duration_sec: 0,
  reference_youtube_url: '',
  style_profile: {
    preset_name: 'Naval History Archival',
    pacing_rules: 'Measured and deliberate. Hold on key historical documents and archival photographs for at least 4.5 seconds. Punctuate dramatic turns with crisp cuts.',
    avg_cut_duration_sec: 5.5,
    color_palette: ['#0A1118', '#1C2E3D', '#7B8D99', '#D8B168', '#F2E8D5'],
    typography: {
      title_font: 'Cinzel',
      subtitle_font: 'Cormorant Garamond',
      caption_font: 'JetBrains Mono',
    },
    earshot_audio_density: 'balanced',
    aspect_ratio: '16:9',
    color_grading_lut: 'Archival_35mm_Clean'
  },
  capcut_draft_path: '',
  agent_config: {
    agent_type: 'hermes',
    custom_flags: '',
    server_url: 'http://localhost:4096'
  },
  scenes: []
};
