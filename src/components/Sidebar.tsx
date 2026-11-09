import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X } from 'lucide-react';
import { ProjectManifest, StyleProfile, StylePreset } from '../types/documentary';
import { STYLE_PRESETS } from '../data/presets';

interface SidebarProps {
  manifest: ProjectManifest;
  activeTab: 'input' | 'dna';
  onTabChange: (tab: 'input' | 'dna') => void;
  onUpdateManifest: (updates: Partial<ProjectManifest>) => void;
  onUpdateStyleProfile: (updates: Partial<StyleProfile>) => void;
  onExtractStyle: (script: string, refUrl: string, presetId: string) => Promise<void>;
  isExtracting: boolean;
  scriptText: string;
  onScriptTextChange: (text: string) => void;
  onResetProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  manifest,
  activeTab,
  onTabChange,
  onUpdateManifest,
  onUpdateStyleProfile,
  onExtractStyle,
  isExtracting,
  scriptText,
  onScriptTextChange,
  onResetProject
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('naval-history-archival');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (preset: StylePreset) => {
    setSelectedPresetId(preset.id);
    onUpdateStyleProfile({
      preset_name: preset.name,
      pacing_rules: preset.pacingRules,
      avg_cut_duration_sec: preset.avgCutDuration,
      color_palette: [...preset.palette],
      typography: { ...preset.typography },
      earshot_audio_density: preset.earshotDensity
    });
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const relativePath = `assets/audio/voiceover/${file.name}`;
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    audio.addEventListener('loadedmetadata', () => {
      const duration = Number(audio.duration.toFixed(1));
      onUpdateManifest({
        voiceover_path: relativePath,
        voiceover_duration_sec: Number.isFinite(duration) ? duration : 0
      });
      URL.revokeObjectURL(objectUrl);
    });

    audio.addEventListener('error', () => {
      onUpdateManifest({
        voiceover_path: relativePath
      });
      URL.revokeObjectURL(objectUrl);
    });
  };

  const handleExtractTrigger = async () => {
    if (!scriptText.trim()) return;
    await onExtractStyle(scriptText, manifest.reference_youtube_url, selectedPresetId);
  };

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const estSeconds = Math.round(wordCount / 2.5);

  return (
    <aside className="w-full lg:w-[390px] xl:w-[410px] shrink-0 apple-glass-sidebar flex flex-col overflow-hidden">
      {/* Apple Segmented Control with Spring Pill */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.07] flex items-center justify-between gap-2.5">
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.07] flex-1">
          {(['input', 'dna'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`relative flex-1 py-1.5 px-3 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer apple-pressable ${
                  isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="sidebar-segmented-pill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
                    className="absolute inset-0 rounded-lg bg-white/[0.13] border-t border-white/20 shadow-sm"
                  />
                )}
                <span className="relative z-10">
                  {tab === 'input' ? '1. Script & Setup' : '2. Style DNA'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onResetProject}
          className="apple-pressable px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          title="Clear project inputs and scenes"
        >
          Reset
        </button>
      </div>

      {/* Scrollable Body with Symmetric Spring Transitions */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'input' ? (
            <motion.div
              key="tab-input"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
              className="space-y-6"
            >
              {/* Section 1: Project & Workspace */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                    Project & Audio Setup
                  </h2>
                  <span className="apple-caption text-[11px] text-zinc-500">Step 1 of 3</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={manifest.project_name}
                      onChange={(e) => onUpdateManifest({ project_name: e.target.value })}
                      placeholder="Enter documentary title..."
                      className="w-full apple-input rounded-xl px-3.5 py-2 text-[13px] text-[#F5F5F7] placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                      Local Workspace Directory
                    </label>
                    <input
                      type="text"
                      value={manifest.workspace_dir}
                      onChange={(e) => onUpdateManifest({ workspace_dir: e.target.value })}
                      placeholder="e.g. ~/Movies/Documentary_Workspace"
                      className="w-full apple-input rounded-xl px-3.5 py-2 text-[12px] font-mono text-zinc-200 placeholder-zinc-500"
                    />
                  </div>

                  {/* Voiceover Input + File Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="apple-caption text-[12px] font-medium text-zinc-300">
                        Voiceover Audio (.mp3 or .wav)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.m4a,.ogg,audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="apple-pressable text-[12px] font-medium text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Browse File</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manifest.voiceover_path}
                          onChange={(e) => onUpdateManifest({ voiceover_path: e.target.value })}
                          placeholder="Path to voiceover file..."
                          className="w-full apple-input rounded-xl pl-3.5 pr-8 py-2 text-[12px] font-mono text-zinc-200 placeholder-zinc-500"
                        />
                        {manifest.voiceover_path && (
                          <button
                            type="button"
                            onClick={() => onUpdateManifest({ voiceover_path: '', voiceover_duration_sec: 0 })}
                            className="apple-pressable absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                            title="Clear voiceover file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="w-24 shrink-0">
                        <div className="flex items-center apple-input rounded-xl px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={manifest.voiceover_duration_sec || ''}
                            onChange={(e) => onUpdateManifest({ voiceover_duration_sec: parseFloat(e.target.value) || 0 })}
                            placeholder="0.0"
                            className="w-full bg-transparent text-[12px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none tabular-nums text-right"
                            title="Voiceover duration in seconds"
                          />
                          <span className="text-[11px] text-zinc-500 ml-1 font-mono">s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-white/[0.07]" />

              {/* Section 2: Documentary Script */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                    Documentary Script
                  </h2>
                  <div className="flex items-center gap-3 apple-caption text-[11px] text-zinc-500">
                    <span>Step 2 of 3</span>
                    {scriptText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => onScriptTextChange('')}
                        className="apple-pressable text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={scriptText}
                  onChange={(e) => onScriptTextChange(e.target.value)}
                  rows={6}
                  placeholder="Paste or type your narration script here. Each sentence or paragraph will be broken down into timed scenes..."
                  className="w-full apple-input rounded-xl p-3.5 text-[13.5px] text-[#F5F5F7] placeholder-zinc-500 leading-relaxed custom-scrollbar"
                />

                <div className="flex items-center justify-between apple-caption text-[11.5px] text-zinc-400 tabular-nums">
                  <span>{wordCount} words</span>
                  <span>~{estSeconds}s estimated narration</span>
                </div>
              </section>

              <hr className="border-white/[0.07]" />

              {/* Section 3: Style DNA Cloner */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                    Style DNA Cloner
                  </h2>
                  <span className="apple-caption text-[11px] text-zinc-500">Step 3 of 3</span>
                </div>

                <div>
                  <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                    Reference YouTube URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={manifest.reference_youtube_url}
                    onChange={(e) => onUpdateManifest({ reference_youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full apple-input rounded-xl px-3.5 py-2 text-[12.5px] text-zinc-200 placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-2">
                    Visual Direction Preset
                  </label>
                  <div className="space-y-2">
                    {STYLE_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`apple-pressable w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A84FF]/[0.14] border-[#0A84FF]/60 border-t-[#0A84FF]/80 text-white shadow-sm'
                              : 'bg-white/[0.03] border-white/[0.07] text-zinc-300 hover:bg-white/[0.05] hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-[13px] text-[#F5F5F7]">
                              {preset.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                                {preset.avgCutDuration}s avg
                              </span>
                              <div className="flex items-center gap-1">
                                {preset.palette.slice(0, 4).map((hex, i) => (
                                  <span
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: hex }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-[12px] text-zinc-400 leading-snug">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExtractTrigger}
                  disabled={isExtracting || !scriptText.trim()}
                  className="apple-pressable w-full py-2.5 px-4 bg-[#0A84FF] hover:bg-[#1B8EFF] disabled:bg-white/[0.06] disabled:text-zinc-500 disabled:border-transparent text-white font-semibold rounded-xl text-[13px] border-t border-white/30 shadow-md shadow-blue-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Extracting Style & Scenes...</span>
                    </>
                  ) : (
                    <span>Extract Style & Break Down Scenes</span>
                  )}
                </button>
                {!scriptText.trim() && (
                  <p className="apple-caption text-[11.5px] text-zinc-500 text-center">
                    Paste your script in Step 2 above to generate timed scenes.
                  </p>
                )}
              </section>
            </motion.div>
          ) : (
            /* Tab 2: Style DNA Inspector & Editor */
            <motion.div
              key="tab-dna"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
              className="space-y-5"
            >
              <div>
                <h2 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                  Style Profile Parameters
                </h2>
                <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
                  Controls cut cadence, motion graphic colors, typography, and Earshot audio density in your manifest.
                </p>
              </div>

              <div>
                <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                  Active Style Name
                </label>
                <input
                  type="text"
                  value={manifest.style_profile.preset_name}
                  onChange={(e) => onUpdateStyleProfile({ preset_name: e.target.value })}
                  className="w-full apple-input rounded-xl px-3.5 py-2 text-[13px] text-[#F5F5F7]"
                />
              </div>

              <div>
                <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                  Pacing & Editing Rules
                </label>
                <textarea
                  value={manifest.style_profile.pacing_rules}
                  onChange={(e) => onUpdateStyleProfile({ pacing_rules: e.target.value })}
                  rows={4}
                  className="w-full apple-input rounded-xl p-3.5 text-[13px] text-zinc-200 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                    Avg Cut Duration (s)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.5"
                    max="20"
                    value={manifest.style_profile.avg_cut_duration_sec}
                    onChange={(e) => onUpdateStyleProfile({ avg_cut_duration_sec: parseFloat(e.target.value) || 4.5 })}
                    className="w-full apple-input rounded-xl px-3.5 py-2 text-[13px] font-mono text-[#F5F5F7] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                    Earshot Audio Density
                  </label>
                  <select
                    value={manifest.style_profile.earshot_audio_density}
                    onChange={(e) => onUpdateStyleProfile({ earshot_audio_density: e.target.value as any })}
                    className="w-full apple-input rounded-xl px-3 py-2 text-[13px] text-[#F5F5F7] cursor-pointer"
                  >
                    <option value="sparse" className="bg-[#16161A]">Sparse</option>
                    <option value="balanced" className="bg-[#16161A]">Balanced</option>
                    <option value="dense" className="bg-[#16161A]">Dense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-2">
                  Color Palette (Hex Codes)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {manifest.style_profile.color_palette.map((color, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div
                        className="w-full h-9 rounded-lg border border-white/15 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const updated = [...manifest.style_profile.color_palette];
                          updated[idx] = e.target.value;
                          onUpdateStyleProfile({ color_palette: updated });
                        }}
                        className="w-full apple-input rounded-md px-1 py-1 text-[10.5px] font-mono text-center text-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.07]">
                <h3 className="apple-caption text-[12px] font-semibold text-zinc-300">
                  Typography Pairing
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block apple-caption text-[11.5px] text-zinc-400 mb-1">Title Font</label>
                    <input
                      type="text"
                      value={manifest.style_profile.typography.title_font}
                      onChange={(e) =>
                        onUpdateStyleProfile({
                          typography: { ...manifest.style_profile.typography, title_font: e.target.value }
                        })
                      }
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block apple-caption text-[11.5px] text-zinc-400 mb-1">Subtitle Font</label>
                    <input
                      type="text"
                      value={manifest.style_profile.typography.subtitle_font}
                      onChange={(e) =>
                        onUpdateStyleProfile({
                          typography: { ...manifest.style_profile.typography, subtitle_font: e.target.value }
                        })
                      }
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block apple-caption text-[11.5px] text-zinc-400 mb-1">Caption / Data Font</label>
                    <input
                      type="text"
                      value={manifest.style_profile.typography.caption_font}
                      onChange={(e) =>
                        onUpdateStyleProfile({
                          typography: { ...manifest.style_profile.typography, caption_font: e.target.value }
                        })
                      }
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] font-mono text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};
