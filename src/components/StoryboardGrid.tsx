import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Save, 
  Settings2, 
  Search,
  FileCode
} from 'lucide-react';
import { Scene, ProjectManifest, AgentRunState } from '../types/documentary';
import { SceneCard } from './SceneCard';

interface StoryboardGridProps {
  manifest: ProjectManifest;
  runState: AgentRunState;
  activeSceneId?: string;
  onUpdateScene: (updated: Scene) => void;
  onDeleteScene: (id: string) => void;
  onDuplicateScene: (scene: Scene) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
  onAddScene: () => void;
  onOpenHyperFramesPreview: (scene: Scene) => void;
  onUpdateAgentConfig: (updates: Partial<ProjectManifest['agent_config']>) => void;
  onUpdateDraftPath: (path: string) => void;
  onSaveManifest: () => void;
  onOpenDirectivesModal: () => void;
  isSaving: boolean;
}

export const StoryboardGrid: React.FC<StoryboardGridProps> = ({
  manifest,
  runState,
  activeSceneId,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  onMoveScene,
  onAddScene,
  onOpenHyperFramesPreview,
  onUpdateAgentConfig,
  onUpdateDraftPath,
  onSaveManifest,
  onOpenDirectivesModal,
  isSaving
}) => {
  const [visualFilter, setVisualFilter] = useState<'all' | 'archival' | 'motion_graphic'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBridgeSettings, setShowBridgeSettings] = useState(false);

  const scenes = manifest.scenes || [];

  const filteredScenes = scenes.filter((scene) => {
    if (visualFilter !== 'all' && scene.visual_mode !== visualFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNarration = scene.narration_text.toLowerCase().includes(q);
      const matchId = scene.id.toLowerCase().includes(q);
      const matchQueries = scene.archival_config?.search_queries?.some(sq => sq.toLowerCase().includes(q));
      const matchPrompt = scene.motion_graphic_config?.prompt?.toLowerCase().includes(q);
      return matchNarration || matchId || matchQueries || matchPrompt;
    }
    return true;
  });

  // Metrics
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration_sec || 0), 0);
  const archivalCount = scenes.filter(s => s.visual_mode === 'archival').length;
  const motionCount = scenes.filter(s => s.visual_mode === 'motion_graphic').length;
  const totalSFXCues = scenes.reduce((acc, s) => acc + (s.sfx_cues?.length || 0), 0);

  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${mins}m ${s}s`;
  };

  return (
    <main className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
      {/* Panel C: Translucent Agent Execution Bridge Bar */}
      <div className="apple-glass-chrome px-6 py-3 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: CLI Agent Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="apple-caption text-[12px] font-medium text-zinc-400 whitespace-nowrap shrink-0">
              CLI Agent:
            </label>
            <select
              value={manifest.agent_config.agent_type}
              onChange={(e) => onUpdateAgentConfig({ agent_type: e.target.value as any })}
              disabled={runState.isRunning}
              className="apple-input rounded-xl px-3 py-1.5 text-[12.5px] font-medium text-[#F5F5F7] cursor-pointer disabled:opacity-50"
            >
              <option value="hermes" className="bg-[#16161A]">Hermes Agent (Headless -q)</option>
              <option value="claude-code" className="bg-[#16161A]">Claude Code (Headless)</option>
              <option value="opencode-cli" className="bg-[#16161A]">OpenCode (Headless CLI)</option>
              <option value="opencode-server" className="bg-[#16161A]">OpenCode (Local HTTP Server :4096)</option>
            </select>

            <button
              type="button"
              onClick={() => setShowBridgeSettings(!showBridgeSettings)}
              className={`apple-pressable px-3 py-1.5 rounded-xl border text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                showBridgeSettings
                  ? 'bg-white/[0.14] border-white/25 text-white'
                  : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>CapCut Path & Flags</span>
            </button>
          </div>

          {/* Right: Save Manifest & Inspect Directives */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenDirectivesModal}
              className="apple-pressable px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-[12px] font-medium text-zinc-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              <span>Preview Directives</span>
            </button>

            <button
              type="button"
              onClick={onSaveManifest}
              disabled={isSaving || runState.isRunning}
              className="apple-pressable px-3.5 py-1.5 bg-white/[0.1] hover:bg-white/[0.15] disabled:opacity-50 border border-white/[0.12] border-t-white/25 text-white rounded-xl text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>{isSaving ? 'Saving...' : 'Save Manifest'}</span>
            </button>
          </div>
        </div>

        {/* Spring-Animated Expandable Custom CLI Flags & CapCut Drafts Path */}
        <AnimatePresence initial={false}>
          {showBridgeSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
              className="overflow-hidden"
            >
              <div className="pt-3.5 mt-3 border-t border-white/[0.07] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block apple-caption text-[11.5px] font-medium text-zinc-300 mb-1">
                    Custom CLI Flags
                  </label>
                  <input
                    type="text"
                    value={manifest.agent_config.custom_flags || ''}
                    onChange={(e) => onUpdateAgentConfig({ custom_flags: e.target.value })}
                    placeholder="e.g. --verbose"
                    className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12px] font-mono text-zinc-200 placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block apple-caption text-[11.5px] font-medium text-zinc-300 mb-1">
                    Target CapCut Drafts Folder Path
                  </label>
                  <input
                    type="text"
                    value={manifest.capcut_draft_path || ''}
                    onChange={(e) => onUpdateDraftPath(e.target.value)}
                    placeholder="~/Movies/CapCut/User Data/Projects/com.lveditor.draft/"
                    className="w-full apple-input rounded-xl px-3.5 py-1.5 text-[12px] font-mono text-zinc-200 placeholder-zinc-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Storyboard Sub-Toolbar: Unboxed Metadata Summary + Spring Filter & Add Scene */}
      <div className="px-6 py-3.5 border-b border-white/[0.05] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 apple-caption text-[12.5px] text-zinc-400 tabular-nums">
          <span className="font-semibold text-[#F5F5F7]">{scenes.length} Scenes</span>
          <span aria-hidden="true">·</span>
          <span>{formatTotalTime(totalDuration)} Total</span>
          <span aria-hidden="true">·</span>
          <span>{archivalCount} Archival</span>
          <span aria-hidden="true">·</span>
          <span>{motionCount} Motion Graphics</span>
          <span aria-hidden="true">·</span>
          <span>{totalSFXCues} SFX Cues</span>
        </div>

        {/* Right: Filter Controls & Add Scene Button */}
        <div className="flex flex-wrap items-center gap-3">
          {scenes.length > 0 && (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter scenes..."
                  className="apple-input rounded-xl pl-8 pr-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500 w-44"
                />
              </div>

              <div className="flex items-center bg-black/45 p-1 rounded-xl border border-white/[0.07]">
                {([
                  { id: 'all', label: 'All' },
                  { id: 'archival', label: 'Archival' },
                  { id: 'motion_graphic', label: 'Motion Graphics' }
                ] as const).map((tab) => {
                  const isActive = visualFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVisualFilter(tab.id)}
                      className={`relative px-2.5 py-1 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer apple-pressable ${
                        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="storyboard-filter-pill"
                          transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
                          className="absolute inset-0 rounded-lg bg-white/[0.13] border-t border-white/20"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onAddScene}
            className="apple-pressable px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.13] text-[#F5F5F7] rounded-xl text-[12px] font-medium flex items-center gap-1.5 border border-white/[0.1] border-t-white/20 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Storyboard Content */}
      <div className="p-6 max-w-6xl mx-auto w-full space-y-5 flex-1">
        {scenes.length === 0 ? (
          /* Clean Apple-Style Onboarding Card */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="apple-glass-card rounded-3xl p-8 md:p-10 my-6 max-w-3xl mx-auto"
          >
            <h2 className="apple-title-lg text-[22px] font-semibold text-[#F5F5F7]">
              Start Your Documentary Storyboard
            </h2>
            <p className="text-[14px] text-zinc-400 mt-2 leading-relaxed">
              Your workspace is clean and ready. Follow the three steps below to break down your narration script into timed scenes and compile a CapCut Desktop draft.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 pt-6 border-t border-white/[0.08]">
              <div className="space-y-1.5">
                <span className="font-mono text-[12px] font-semibold text-[#0A84FF]">
                  01. Script & Audio
                </span>
                <h3 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                  Enter Project Details
                </h3>
                <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                  Set your project name, local workspace path, and voiceover audio file in the left sidebar, then paste your script.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[12px] font-semibold text-[#0A84FF]">
                  02. Scene Breakdown
                </span>
                <h3 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                  Extract Style & Scenes
                </h3>
                <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                  Click &ldquo;Extract Style &amp; Break Down Scenes&rdquo; to automatically segment your script into timed archival and motion graphic cuts.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[12px] font-semibold text-[#0A84FF]">
                  03. Local CLI Assembly
                </span>
                <h3 className="apple-title-md text-[14px] font-semibold text-[#F5F5F7]">
                  Build CapCut Draft
                </h3>
                <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                  Fine-tune search queries, VLM criteria, and Earshot SFX offsets, then run Hermes, Claude Code, or OpenCode to generate your CapCut project.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onAddScene}
                className="apple-pressable px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] border border-white/[0.12] border-t-white/25 text-[#F5F5F7] font-medium rounded-xl text-[13px] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0A84FF]" />
                <span>Add Blank Scene Manually</span>
              </button>
            </div>
          </motion.div>
        ) : filteredScenes.length === 0 ? (
          <div className="text-center py-12 apple-glass-card rounded-2xl p-6">
            <p className="text-[14px] text-zinc-300 font-medium">No scenes match your current filter</p>
            <button
              type="button"
              onClick={() => {
                setVisualFilter('all');
                setSearchQuery('');
              }}
              className="apple-pressable mt-3 px-3.5 py-1.5 bg-white/[0.1] hover:bg-white/[0.15] text-[12px] text-white rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {filteredScenes.map((scene) => {
                const originalIndex = scenes.findIndex(s => s.id === scene.id);
                return (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    index={originalIndex}
                    totalScenes={scenes.length}
                    isActiveInRun={activeSceneId === scene.id}
                    onUpdateScene={onUpdateScene}
                    onDeleteScene={onDeleteScene}
                    onDuplicateScene={onDuplicateScene}
                    onMoveScene={onMoveScene}
                    onOpenHyperFramesPreview={onOpenHyperFramesPreview}
                  />
                );
              })}
            </AnimatePresence>

            <div className="pt-2 pb-6 text-center">
              <button
                type="button"
                onClick={onAddScene}
                className="apple-pressable px-4 py-2 rounded-xl border border-white/[0.09] hover:border-white/[0.18] bg-white/[0.03] hover:bg-white/[0.07] text-zinc-200 text-[12.5px] font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0A84FF]" />
                <span>Append Scene Cut</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};
