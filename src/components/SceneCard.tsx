import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus,
  Eye,
  X
} from 'lucide-react';
import { Scene, SFXCue } from '../types/documentary';

interface SceneCardProps {
  scene: Scene;
  index: number;
  totalScenes: number;
  isActiveInRun: boolean;
  onUpdateScene: (updated: Scene) => void;
  onDeleteScene: (id: string) => void;
  onDuplicateScene: (scene: Scene) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
  onOpenHyperFramesPreview: (scene: Scene) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  totalScenes,
  isActiveInRun,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  onMoveScene,
  onOpenHyperFramesPreview
}) => {
  const [newQueryInput, setNewQueryInput] = useState('');

  const handleVisualModeChange = (mode: 'archival' | 'motion_graphic') => {
    if (mode === 'archival' && !scene.archival_config) {
      onUpdateScene({
        ...scene,
        visual_mode: 'archival',
        archival_config: {
          search_queries: scene.narration_text.trim()
            ? [`${scene.narration_text.slice(0, 45).trim()} archival footage`]
            : [],
          source_priority: 'all',
          vlm_verification_criteria: '',
          timestamp_range: '00:00:10-00:00:16'
        }
      });
    } else if (mode === 'motion_graphic' && !scene.motion_graphic_config) {
      onUpdateScene({
        ...scene,
        visual_mode: 'motion_graphic',
        motion_graphic_config: {
          prompt: '',
          style_theme: 'Dark Slate Telemetry'
        }
      });
    } else {
      onUpdateScene({
        ...scene,
        visual_mode: mode
      });
    }
  };

  const handleAddSearchQuery = () => {
    if (!newQueryInput.trim()) return;
    const current = scene.archival_config?.search_queries || [];
    onUpdateScene({
      ...scene,
      archival_config: {
        ...(scene.archival_config || {
          source_priority: 'all',
          vlm_verification_criteria: ''
        }),
        search_queries: [...current, newQueryInput.trim()]
      }
    });
    setNewQueryInput('');
  };

  const handleUpdateSearchQuery = (qIdx: number, value: string) => {
    const current = [...(scene.archival_config?.search_queries || [])];
    current[qIdx] = value;
    onUpdateScene({
      ...scene,
      archival_config: {
        ...scene.archival_config!,
        search_queries: current
      }
    });
  };

  const handleRemoveSearchQuery = (queryIdx: number) => {
    const current = scene.archival_config?.search_queries || [];
    onUpdateScene({
      ...scene,
      archival_config: {
        ...scene.archival_config!,
        search_queries: current.filter((_, idx) => idx !== queryIdx)
      }
    });
  };

  const handleAddSFXCue = () => {
    const newCue: SFXCue = {
      id: `sfx_${Date.now()}`,
      tag: 'ambient_transition',
      offset_ms: 0,
      volume_db: -6.0
    };
    onUpdateScene({
      ...scene,
      sfx_cues: [...scene.sfx_cues, newCue]
    });
  };

  const handleUpdateSFXCue = (cueId: string, updates: Partial<SFXCue>) => {
    onUpdateScene({
      ...scene,
      sfx_cues: scene.sfx_cues.map(c => c.id === cueId ? { ...c, ...updates } : c)
    });
  };

  const handleRemoveSFXCue = (cueId: string) => {
    onUpdateScene({
      ...scene,
      sfx_cues: scene.sfx_cues.filter(c => c.id !== cueId)
    });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.38 }}
      className={`apple-glass-card rounded-2xl transition-colors ${
        isActiveInRun
          ? 'ring-1 ring-[#0A84FF]/80 border-[#0A84FF]/50'
          : 'hover:border-white/[0.12]'
      }`}
    >
      {/* Top Bar: Scene Number, Timecodes, Visual Mode Segmented Switch, Actions */}
      <div className="px-5 py-3.5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <span className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
              Scene {String(scene.scene_number).padStart(2, '0')}
            </span>
            <span className="text-[12px] font-mono text-zinc-500">
              {scene.id}
            </span>
          </div>

          <span className="text-zinc-700" aria-hidden="true">·</span>

          {/* Timecode Inputs */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono tabular-nums">
            <input
              type="text"
              value={scene.start_time}
              onChange={(e) => onUpdateScene({ ...scene, start_time: e.target.value })}
              className="w-20 apple-input rounded-lg px-2 py-1 text-zinc-200 text-center"
              title="Start Time (MM:SS.ms)"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="text"
              value={scene.end_time}
              onChange={(e) => onUpdateScene({ ...scene, end_time: e.target.value })}
              className="w-20 apple-input rounded-lg px-2 py-1 text-zinc-200 text-center"
              title="End Time (MM:SS.ms)"
            />
            <span className="text-zinc-400 ml-1">
              ({scene.duration_sec}s)
            </span>
          </div>

          {isActiveInRun && (
            <span className="apple-caption text-[11.5px] font-medium text-[#0A84FF]">
              · Active in Agent Pipeline
            </span>
          )}
        </div>

        {/* Right Controls: Spring Segmented Visual Mode Toggle & Card Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/45 p-1 rounded-xl border border-white/[0.07]">
            {(['archival', 'motion_graphic'] as const).map((mode) => {
              const isSelected = scene.visual_mode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleVisualModeChange(mode)}
                  className={`relative px-3 py-1 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer apple-pressable ${
                    isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`visual-mode-pill-${scene.id}`}
                      transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
                      className="absolute inset-0 rounded-lg bg-white/[0.13] border-t border-white/20 shadow-xs"
                    />
                  )}
                  <span className="relative z-10">
                    {mode === 'archival'
                      ? 'Archival Footage (yt-dlp + SearXNG)'
                      : 'Motion Graphic (HyperFrames)'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-0.5 text-zinc-400">
            <button
              type="button"
              onClick={() => onMoveScene(index, 'up')}
              disabled={index === 0}
              className="apple-pressable p-1.5 hover:text-white disabled:opacity-25 rounded-lg hover:bg-white/[0.07] cursor-pointer disabled:cursor-not-allowed"
              title="Move Scene Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMoveScene(index, 'down')}
              disabled={index === totalScenes - 1}
              className="apple-pressable p-1.5 hover:text-white disabled:opacity-25 rounded-lg hover:bg-white/[0.07] cursor-pointer disabled:cursor-not-allowed"
              title="Move Scene Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicateScene(scene)}
              className="apple-pressable p-1.5 hover:text-white rounded-lg hover:bg-white/[0.07] cursor-pointer"
              title="Duplicate Scene"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteScene(scene.id)}
              className="apple-pressable p-1.5 hover:text-[#FF453A] rounded-lg hover:bg-white/[0.07] cursor-pointer"
              title="Delete Scene"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split: Narration + SFX on Left, Visual Pipeline Spec on Right */}
      <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Narration & Earshot SFX */}
        <div className="xl:col-span-5 space-y-5">
          <div>
            <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
              Narration Text
            </label>
            <textarea
              value={scene.narration_text}
              onChange={(e) => onUpdateScene({ ...scene, narration_text: e.target.value })}
              rows={3}
              placeholder="Spoken voiceover narration for this scene..."
              className="w-full apple-input rounded-xl p-3 text-[13.5px] text-[#F5F5F7] placeholder-zinc-500 leading-relaxed"
            />
          </div>

          {/* Audio / SFX Track (Earshot) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="apple-caption text-[12px] font-medium text-zinc-300">
                Earshot SFX Triggers ({scene.sfx_cues.length})
              </label>
              <button
                type="button"
                onClick={handleAddSFXCue}
                className="apple-pressable text-[12px] font-medium text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add SFX Trigger</span>
              </button>
            </div>

            {scene.sfx_cues.length === 0 ? (
              <p className="apple-caption text-[12px] text-zinc-500 py-1.5">
                No sound effects attached to this cut.
              </p>
            ) : (
              <div className="space-y-2">
                {scene.sfx_cues.map((cue) => (
                  <div
                    key={cue.id}
                    className="flex flex-wrap items-center gap-2 apple-input rounded-xl p-2 text-[12px]"
                  >
                    <input
                      type="text"
                      value={cue.tag}
                      onChange={(e) => handleUpdateSFXCue(cue.id, { tag: e.target.value })}
                      placeholder="SFX tag (e.g. low_sonar_ping)"
                      className="flex-1 min-w-[130px] bg-transparent font-mono text-[12px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:text-[#409CFF] px-1.5"
                    />
                    <div className="flex items-center gap-1 text-zinc-400 font-mono tabular-nums">
                      <input
                        type="number"
                        step="25"
                        value={cue.offset_ms}
                        onChange={(e) => handleUpdateSFXCue(cue.id, { offset_ms: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-right text-zinc-200 focus:outline-none focus:border-[#0A84FF]"
                        title="Millisecond offset relative to cut"
                      />
                      <span>ms</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400 font-mono tabular-nums">
                      <input
                        type="number"
                        step="0.5"
                        max="0"
                        min="-40"
                        value={cue.volume_db}
                        onChange={(e) => handleUpdateSFXCue(cue.id, { volume_db: parseFloat(e.target.value) || -6.0 })}
                        className="w-14 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-right text-zinc-200 focus:outline-none focus:border-[#0A84FF]"
                        title="Audio gain in dB"
                      />
                      <span>dB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSFXCue(cue.id)}
                      className="apple-pressable p-1 text-zinc-500 hover:text-[#FF453A] cursor-pointer"
                      title="Remove SFX trigger"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Pipeline Configuration */}
        <div className="xl:col-span-7 xl:border-l xl:border-white/[0.07] xl:pl-6">
          <AnimatePresence mode="wait" initial={false}>
            {scene.visual_mode === 'archival' ? (
              <motion.div
                key="mode-archival"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="apple-caption text-[12px] font-medium text-zinc-300">
                      Archival Search Queries (Wikimedia, Archive.org, YouTube)
                    </label>
                    <span className="apple-caption text-[11px] text-zinc-500">SearXNG + yt-dlp</span>
                  </div>

                  <div className="space-y-2 mb-2">
                    {(scene.archival_config?.search_queries || []).map((query, qIdx) => (
                      <div key={qIdx} className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-zinc-500 w-5 tabular-nums">
                          {qIdx + 1}.
                        </span>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => handleUpdateSearchQuery(qIdx, e.target.value)}
                          className="flex-1 apple-input rounded-xl px-3 py-1.5 text-[12.5px] text-zinc-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSearchQuery(qIdx)}
                          className="apple-pressable p-1.5 text-zinc-500 hover:text-[#FF453A] cursor-pointer"
                          title="Remove query"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newQueryInput}
                      onChange={(e) => setNewQueryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSearchQuery()}
                      placeholder="Add search query for archival footage..."
                      className="flex-1 apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] text-zinc-200 placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSearchQuery}
                      className="apple-pressable px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.13] border-t border-white/15 text-zinc-200 rounded-xl text-[12px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add Query
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block apple-caption text-[12px] font-medium text-zinc-300 mb-1.5">
                    VLM Verification Criteria (Keyframe Inspection Rules)
                  </label>
                  <textarea
                    value={scene.archival_config?.vlm_verification_criteria || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...scene,
                        archival_config: {
                          ...(scene.archival_config || { search_queries: [], source_priority: 'all' }),
                          vlm_verification_criteria: e.target.value
                        }
                      })
                    }
                    rows={2}
                    placeholder="Describe what the visual frame must contain and what to reject (e.g., reject burned-in subtitles or watermarks)..."
                    className="w-full apple-input rounded-xl p-3 text-[12.5px] text-zinc-200 placeholder-zinc-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block apple-caption text-[11.5px] font-medium text-zinc-400 mb-1">
                      Clip Section Timestamp (--download-sections)
                    </label>
                    <input
                      type="text"
                      value={scene.archival_config?.timestamp_range || ''}
                      onChange={(e) =>
                        onUpdateScene({
                          ...scene,
                          archival_config: {
                            ...(scene.archival_config || { search_queries: [], source_priority: 'all', vlm_verification_criteria: '' }),
                            timestamp_range: e.target.value
                          }
                        })
                      }
                      placeholder="00:01:15-00:01:22"
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12px] font-mono text-zinc-200 placeholder-zinc-500 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block apple-caption text-[11.5px] font-medium text-zinc-400 mb-1">
                      Primary Archive Source
                    </label>
                    <select
                      value={scene.archival_config?.source_priority || 'all'}
                      onChange={(e) =>
                        onUpdateScene({
                          ...scene,
                          archival_config: {
                            ...(scene.archival_config || { search_queries: [], vlm_verification_criteria: '' }),
                            source_priority: e.target.value as any
                          }
                        })
                      }
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] text-zinc-200 cursor-pointer"
                    >
                      <option value="all" className="bg-[#16161A]">All Sources (SearXNG Universal)</option>
                      <option value="archive_org" className="bg-[#16161A]">Internet Archive (Archive.org)</option>
                      <option value="wikimedia" className="bg-[#16161A]">Wikimedia Commons</option>
                      <option value="youtube" className="bg-[#16161A]">YouTube Timestamped Clips</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Motion Graphic Mode (HyperFrames HTML/CSS) */
              <motion.div
                key="mode-motion"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="apple-caption text-[12px] font-medium text-zinc-300">
                      HyperFrames HTML/CSS/SVG Animation Prompt
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenHyperFramesPreview(scene)}
                      className="apple-pressable text-[12px] font-medium text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Motion Graphic</span>
                    </button>
                  </div>

                  <textarea
                    value={scene.motion_graphic_config?.prompt || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...scene,
                        motion_graphic_config: {
                          ...(scene.motion_graphic_config || { style_theme: 'Dark Slate Telemetry' }),
                          prompt: e.target.value
                        }
                      })
                    }
                    rows={4}
                    placeholder="Describe the deterministic single-file HTML/CSS/SVG animation to render at 60fps (e.g., animated map, timeline chart, or data visualization)..."
                    className="w-full apple-input rounded-xl p-3 text-[12.5px] text-zinc-200 placeholder-zinc-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block apple-caption text-[11.5px] font-medium text-zinc-400 mb-1">
                      Visual Style Theme
                    </label>
                    <input
                      type="text"
                      value={scene.motion_graphic_config?.style_theme || ''}
                      onChange={(e) =>
                        onUpdateScene({
                          ...scene,
                          motion_graphic_config: {
                            ...(scene.motion_graphic_config || { prompt: '' }),
                            style_theme: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. Dark Slate Tactical Map"
                      className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12.5px] text-zinc-200 placeholder-zinc-500"
                    />
                  </div>
                  <div className="apple-caption text-[12px] text-zinc-400 font-mono pb-1.5">
                    Output: 1920×1080 · 60fps MP4 ({scene.duration_sec}s)
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
};
