/**
 * StenGen
 * Visual Storyboard Dashboard & CLI Coding Agent Orchestration Bridge
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_MANIFEST } from './data/presets';
import { ProjectManifest, Scene, AgentLogEvent, AgentRunState } from './types/documentary';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StoryboardGrid } from './components/StoryboardGrid';
import { TerminalDrawer } from './components/TerminalDrawer';
import { DirectiveModal } from './components/DirectiveModal';
import { HyperFramesPreviewModal } from './components/HyperFramesPreviewModal';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'agentic_studio_clean_v3';

export default function App() {
  const [manifest, setManifest] = useState<ProjectManifest>(() => {
    try {
      localStorage.removeItem('agentic_doc_manifest');
      localStorage.removeItem('agentic_studio_clean_v2');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_MANIFEST,
          ...parsed,
          project_name: parsed.project_name || 'StenGen',
          agent_config: {
            ...INITIAL_MANIFEST.agent_config,
            ...(parsed.agent_config || {})
          }
        };
      }
      return INITIAL_MANIFEST;
    } catch {
      return INITIAL_MANIFEST;
    }
  });

  const [scriptText, setScriptText] = useState<string>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_script`) || '';
    } catch {
      return '';
    }
  });

  const [sidebarTab, setSidebarTab] = useState<'input' | 'dna'>('input');
  const [activeNav, setActiveNav] = useState<'workspace' | 'style' | 'directives' | 'console'>('workspace');

  const [runState, setRunState] = useState<AgentRunState>({
    isRunning: false,
    agentType: 'hermes',
    completedScenesCount: 0,
    totalScenesCount: 0,
    statusMessage: 'Idle'
  });

  const [logs, setLogs] = useState<AgentLogEvent[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isDirectivesModalOpen, setIsDirectivesModalOpen] = useState<boolean>(false);
  const [previewScene, setPreviewScene] = useState<Scene | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    onUndo?: () => void;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manifest));
    } catch {
      // Ignored
    }
  }, [manifest]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_script`, scriptText);
    } catch {
      // Ignored
    }
  }, [scriptText]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info', onUndo?: () => void) => {
      setToast({ message, type, onUndo });
      setTimeout(() => {
        setToast(prev => (prev?.message === message ? null : prev));
      }, 4500);
    },
    []
  );

  // Connect to SSE Live Agent Log Stream (/api/agent-stream)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/agent-stream');

      eventSource.addEventListener('state', (e: MessageEvent) => {
        try {
          const stateData = JSON.parse(e.data);
          setRunState(prev => ({
            ...prev,
            ...stateData,
            completedScenesCount: stateData.completedCount ?? prev.completedScenesCount,
            totalScenesCount: stateData.totalCount ?? prev.totalScenesCount,
            statusMessage: stateData.statusMessage ?? prev.statusMessage
          }));
        } catch (err) {
          console.error('Error parsing SSE state:', err);
        }
      });

      eventSource.addEventListener('log', (e: MessageEvent) => {
        try {
          const logData = JSON.parse(e.data);
          setLogs(prev => [...prev, logData]);
        } catch (err) {
          console.error('Error parsing SSE log:', err);
        }
      });

      eventSource.addEventListener('history', (e: MessageEvent) => {
        try {
          const historyData = JSON.parse(e.data);
          if (Array.isArray(historyData) && historyData.length > 0) {
            setLogs(prev => (prev.length === 0 ? historyData : prev));
          }
        } catch (err) {
          console.error('Error parsing SSE history:', err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleSelectNav = (nav: 'workspace' | 'style' | 'directives' | 'console') => {
    setActiveNav(nav);
    if (nav === 'workspace') {
      setSidebarTab('input');
    } else if (nav === 'style') {
      setSidebarTab('dna');
    } else if (nav === 'directives') {
      setIsDirectivesModalOpen(true);
    } else if (nav === 'console') {
      setIsTerminalOpen(prev => !prev);
    }
  };

  const handleResetProject = () => {
    const previousManifest = manifest;
    const previousScript = scriptText;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_script`);
    setManifest(INITIAL_MANIFEST);
    setScriptText('');
    setLogs([]);
    showToast('Project cleared', 'info', () => {
      setManifest(previousManifest);
      setScriptText(previousScript);
    });
  };

  // Save Manifest to Backend Disk
  const handleSaveManifest = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/save-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Saved manifest.json, AGENTS.md, CLAUDE.md & hermes_prompt.txt to ${data.workspace}`, 'success');
      } else {
        showToast(data.error || 'Failed to save manifest', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving manifest', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Run CLI Agent
  const handleRunAgent = async () => {
    if (manifest.scenes.length === 0) {
      showToast('Add or extract at least one scene before building a CapCut draft.', 'error');
      return;
    }

    setIsTerminalOpen(true);
    try {
      await fetch('/api/save-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest })
      });

      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest,
          agentType: manifest.agent_config.agent_type,
          flags: manifest.agent_config.custom_flags
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Agent started: ${manifest.agent_config.agent_type}`, 'info');
      } else {
        showToast(data.error || 'Could not start agent process', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error running agent', 'error');
    }
  };

  // Stop CLI Agent
  const handleStopAgent = async () => {
    try {
      const res = await fetch('/api/stop-agent', { method: 'POST' });
      if (res.ok) {
        showToast('Agent execution stopped', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to stop agent', 'error');
    }
  };

  // Gemini Style DNA Extraction & Scene Breakdown
  const handleExtractStyle = async (script: string, refUrl: string, presetId: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch('/api/gemini/extract-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          referenceYoutubeUrl: refUrl,
          presetId
        })
      });

      const data = await res.json();
      if (res.ok && data.scenes && data.style_profile) {
        const computedDuration = Number(
          data.scenes.reduce((acc: number, s: any) => acc + (s.duration_sec || 0), 0).toFixed(1)
        );
        setManifest(prev => ({
          ...prev,
          style_profile: data.style_profile,
          scenes: data.scenes,
          voiceover_duration_sec: prev.voiceover_duration_sec || computedDuration
        }));
        showToast(`Generated ${data.scenes.length} timed scenes from your script`, 'success');
      } else {
        showToast(data.error || 'Failed to extract style profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error extracting style', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Scene Operations with Undo Forgiveness (§16.2 Agency)
  const handleUpdateScene = (updated: Scene) => {
    setManifest(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => (s.id === updated.id ? updated : s))
    }));
  };

  const handleDeleteScene = (id: string) => {
    const previousScenes = [...manifest.scenes];
    setManifest(prev => ({
      ...prev,
      scenes: prev.scenes
        .filter(s => s.id !== id)
        .map((s, idx) => ({
          ...s,
          id: `SCN_${String(idx + 1).padStart(2, '0')}`,
          scene_number: idx + 1
        }))
    }));
    showToast(`Removed ${id}`, 'info', () => {
      setManifest(prev => ({ ...prev, scenes: previousScenes }));
    });
  };

  const handleDuplicateScene = (scene: Scene) => {
    const nextNum = manifest.scenes.length + 1;
    const newId = `SCN_${String(nextNum).padStart(2, '0')}`;
    const duplicated: Scene = {
      ...scene,
      id: newId,
      scene_number: nextNum,
      sfx_cues: scene.sfx_cues.map((c, i) => ({ ...c, id: `sfx_${Date.now()}_${i}` }))
    };

    setManifest(prev => ({
      ...prev,
      scenes: [...prev.scenes, duplicated]
    }));
    showToast(`Duplicated ${scene.id} as ${newId}`, 'info');
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= manifest.scenes.length) return;

    const newScenes = [...manifest.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    const renumbered = newScenes.map((s, idx) => ({
      ...s,
      id: `SCN_${String(idx + 1).padStart(2, '0')}`,
      scene_number: idx + 1
    }));

    setManifest(prev => ({ ...prev, scenes: renumbered }));
  };

  const handleAddScene = () => {
    const nextNum = manifest.scenes.length + 1;
    const newId = `SCN_${String(nextNum).padStart(2, '0')}`;
    const lastScene = manifest.scenes[manifest.scenes.length - 1];
    const startTime = lastScene ? lastScene.end_time : '00:00.00';
    const duration = manifest.style_profile.avg_cut_duration_sec || 5.0;

    const [m, s] = startTime.split(':');
    const startSec = (parseFloat(m) || 0) * 60 + (parseFloat(s) || 0);
    const endSec = startSec + duration;
    const endM = Math.floor(endSec / 60);
    const endS = Math.floor(endSec % 60);
    const endMs = Math.floor((endSec % 1) * 100);
    const endTime = `${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.${String(endMs).padStart(2, '0')}`;

    const newScene: Scene = {
      id: newId,
      scene_number: nextNum,
      start_time: startTime,
      end_time: endTime,
      duration_sec: duration,
      narration_text: '',
      visual_mode: 'archival',
      archival_config: {
        search_queries: [],
        source_priority: 'all',
        vlm_verification_criteria: '',
        timestamp_range: '00:00:00-00:00:05'
      },
      sfx_cues: []
    };

    setManifest(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  return (
    <div className="min-h-screen text-[#F5F5F7] flex flex-col font-sans selection:bg-[#0A84FF]/35 selection:text-white">
      {/* Apple Translucent Floating Toast Capsule with Undo Forgiveness */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.34 }}
            className="fixed top-18 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full apple-glass-card text-[12.5px]"
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#FF453A] shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#0A84FF] shrink-0" />}
            <span className="text-[#F5F5F7] font-medium">{toast.message}</span>
            {toast.onUndo && (
              <button
                type="button"
                onClick={() => {
                  toast.onUndo?.();
                  setToast(null);
                }}
                className="apple-pressable px-2.5 py-0.5 rounded-full bg-white/[0.14] hover:bg-white/[0.22] text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="apple-pressable text-zinc-400 hover:text-white ml-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <Header
        runState={runState}
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        onRunAgent={handleRunAgent}
        onStopAgent={handleStopAgent}
        sceneCount={manifest.scenes.length}
      />

      {/* Main Workspace */}
      <div className={`flex flex-col lg:flex-row flex-1 overflow-hidden ${isTerminalOpen ? 'pb-72' : 'pb-11'}`}>
        {/* Panel A: Project Setup & Style DNA Cloner */}
        <Sidebar
          manifest={manifest}
          activeTab={sidebarTab}
          onTabChange={(tab) => {
            setSidebarTab(tab);
            setActiveNav(tab === 'input' ? 'workspace' : 'style');
          }}
          onUpdateManifest={(updates) => setManifest(prev => ({ ...prev, ...updates }))}
          onUpdateStyleProfile={(updates) =>
            setManifest(prev => ({
              ...prev,
              style_profile: { ...prev.style_profile, ...updates }
            }))
          }
          onExtractStyle={handleExtractStyle}
          isExtracting={isExtracting}
          scriptText={scriptText}
          onScriptTextChange={setScriptText}
          onResetProject={handleResetProject}
        />

        {/* Panel B & Panel C: Agent Bridge & Interactive Scene Storyboard */}
        <StoryboardGrid
          manifest={manifest}
          runState={runState}
          activeSceneId={runState.activeSceneId}
          onUpdateScene={handleUpdateScene}
          onDeleteScene={handleDeleteScene}
          onDuplicateScene={handleDuplicateScene}
          onMoveScene={handleMoveScene}
          onAddScene={handleAddScene}
          onOpenHyperFramesPreview={(scene) => setPreviewScene(scene)}
          onUpdateAgentConfig={(updates) =>
            setManifest(prev => ({
              ...prev,
              agent_config: { ...prev.agent_config, ...updates }
            }))
          }
          onUpdateDraftPath={(path) => setManifest(prev => ({ ...prev, capcut_draft_path: path }))}
          onSaveManifest={handleSaveManifest}
          onOpenDirectivesModal={() => setIsDirectivesModalOpen(true)}
          isSaving={isSaving}
        />
      </div>

      {/* Panel D: Live Agent Terminal Stream Sheet */}
      <TerminalDrawer
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
        logs={logs}
        runState={runState}
        onStopAgent={handleStopAgent}
        onClearLogs={() => setLogs([])}
      />

      {/* Modals */}
      <DirectiveModal
        isOpen={isDirectivesModalOpen}
        onClose={() => {
          setIsDirectivesModalOpen(false);
          setActiveNav(sidebarTab === 'input' ? 'workspace' : 'style');
        }}
        manifest={manifest}
      />

      <HyperFramesPreviewModal
        scene={previewScene}
        onClose={() => setPreviewScene(null)}
      />
    </div>
  );
}
