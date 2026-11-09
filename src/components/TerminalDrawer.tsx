import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Download, 
  Square
} from 'lucide-react';
import { AgentLogEvent, AgentRunState } from '../types/documentary';

interface TerminalDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: AgentLogEvent[];
  runState: AgentRunState;
  onStopAgent: () => void;
  onClearLogs: () => void;
}

// Apple Rubber-Banding Formula (§9)
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// Apple Momentum Projection Formula (§6)
function project(initialVelocity: number, decelerationRate = 0.998): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onToggle,
  logs,
  runState,
  onStopAgent,
  onClearLogs
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [sheetHeight, setSheetHeight] = useState<number>(288);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Pointer history for velocity projection (§2, §5, §6)
  const pointerState = useRef<{
    isDragging: boolean;
    startY: number;
    startHeight: number;
    history: Array<{ y: number; t: number }>;
  }>({
    isDragging: false,
    startY: 0,
    startHeight: 288,
    history: []
  });

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerState.current = {
      isDragging: true,
      startY: e.clientY,
      startHeight: sheetHeight,
      history: [{ y: e.clientY, t: performance.now() }]
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current.isDragging) return;
    const now = performance.now();
    const deltaY = pointerState.current.startY - e.clientY; // positive when dragging up
    const rawHeight = pointerState.current.startHeight + deltaY;

    const minH = 160;
    const maxH = 520;

    let clampedHeight = rawHeight;
    if (rawHeight > maxH) {
      clampedHeight = maxH + rubberband(rawHeight - maxH, 240);
    } else if (rawHeight < minH) {
      clampedHeight = minH - rubberband(minH - rawHeight, 160);
    }

    setSheetHeight(clampedHeight);
    setDragOffsetY(0);

    const hist = pointerState.current.history;
    hist.push({ y: e.clientY, t: now });
    if (hist.length > 6) hist.shift();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current.isDragging) return;
    pointerState.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const hist = pointerState.current.history;
    let velocityY = 0; // px/s (positive = moving down)
    if (hist.length >= 2) {
      const first = hist[0];
      const last = hist[hist.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.005) {
        velocityY = (last.y - first.y) / dt;
      }
    }

    const projectedHeight = sheetHeight - project(velocityY, 0.992);
    // If flicked downward with high velocity or dragged below threshold, collapse sheet
    if (velocityY > 650 || projectedHeight < 130) {
      setSheetHeight(288);
      onToggle();
      return;
    }

    // Snap between standard (288px) and tall (460px) based on projected endpoint
    const targetSnap = projectedHeight > 370 ? 460 : 288;
    setSheetHeight(targetSnap);
  };

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getStageLabel = (type: string) => {
    switch (type) {
      case 'DOWNLOAD':
        return <span className="text-[#FF9F0A] font-semibold">YT-DLP</span>;
      case 'VLM_VERIFY':
        return <span className="text-[#30D158] font-semibold">VLM-VERIFY</span>;
      case 'HYPERFRAMES':
        return <span className="text-[#0A84FF] font-semibold">HYPERFRAMES</span>;
      case 'EARSHOT':
        return <span className="text-[#BF5AF2] font-semibold">EARSHOT</span>;
      case 'PYCAPCUT':
        return <span className="text-[#FF9F0A] font-semibold">PYCAPCUT</span>;
      case 'SUCCESS':
        return <span className="text-[#30D158] font-semibold">COMPLETE</span>;
      case 'ERROR':
        return <span className="text-[#FF453A] font-semibold">ERROR</span>;
      default:
        return <span className="text-zinc-400">SYSTEM</span>;
    }
  };

  const handleDownloadLogs = () => {
    const textContent = logs
      .map(l => `[${l.timestamp}] [${l.type}] ${l.scene_id ? `(${l.scene_id}) ` : ''}${l.message}`)
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-stream-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {!isOpen ? (
        <motion.div
          key="console-collapsed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-30"
        >
          <div className="w-full apple-glass-sheet px-6 py-2.5 flex items-center justify-between text-[12px] text-zinc-300">
            <button
              type="button"
              onClick={onToggle}
              className="apple-pressable flex items-center gap-3 text-left cursor-pointer hover:text-white"
            >
              <span className="apple-title-md font-semibold text-[#F5F5F7]">
                Live Agent Console
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="font-mono text-zinc-400 tabular-nums">
                {runState.isRunning ? runState.statusMessage : `${logs.length} events`}
              </span>
            </button>

            <div className="flex items-center gap-3">
              {runState.isRunning && (
                <button
                  type="button"
                  onClick={onStopAgent}
                  className="apple-pressable px-3 py-1 bg-[#FF453A] hover:bg-[#FF554A] text-white rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Stop Agent</span>
                </button>
              )}
              <button
                type="button"
                onClick={onToggle}
                className="apple-pressable p-1 text-zinc-400 hover:text-white cursor-pointer"
                title="Expand Agent Console"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="console-expanded"
          initial={{ y: '100%', opacity: 0.6 }}
          animate={{ y: dragOffsetY, height: sheetHeight, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.16, duration: 0.36 }}
          className="fixed bottom-0 left-0 right-0 z-30 apple-glass-sheet flex flex-col select-none"
        >
          {/* Apple Sheet Grabber Bar (1:1 Direct Manipulation + Rubber-Banding + Velocity Projection) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full pt-2 pb-1 flex justify-center cursor-ns-resize touch-none"
            title="Drag to resize or flick down to dismiss"
          >
            <div className="w-9 h-1 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
          </div>

          {/* Console Header Bar */}
          <div className="h-10 px-6 flex items-center justify-between border-b border-white/[0.08] text-[12px]">
            <div className="flex items-center gap-3">
              <span className="apple-title-md font-semibold text-[#F5F5F7]">
                Live Agent Console
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="font-mono text-zinc-400 tabular-nums">
                {runState.isRunning
                  ? `${runState.statusMessage} (${runState.completedCount ?? runState.completedScenesCount}/${runState.totalCount ?? runState.totalScenesCount})`
                  : 'Idle'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="apple-input rounded-lg px-2.5 py-1 text-zinc-200 text-[11.5px] cursor-pointer"
              >
                <option value="ALL" className="bg-[#16161A]">All Events ({logs.length})</option>
                <option value="DOWNLOAD" className="bg-[#16161A]">yt-dlp Downloads</option>
                <option value="VLM_VERIFY" className="bg-[#16161A]">VLM Verification</option>
                <option value="HYPERFRAMES" className="bg-[#16161A]">HyperFrames Render</option>
                <option value="EARSHOT" className="bg-[#16161A]">Earshot SFX Sync</option>
                <option value="PYCAPCUT" className="bg-[#16161A]">pyCapCut Draft</option>
                <option value="ERROR" className="bg-[#16161A]">Errors</option>
              </select>

              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`apple-pressable px-2.5 py-1 rounded-lg text-[11.5px] border transition-colors cursor-pointer ${
                  autoScroll
                    ? 'bg-white/[0.12] border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-500'
                }`}
              >
                Auto-Scroll
              </button>

              <button
                type="button"
                onClick={onClearLogs}
                className="apple-pressable p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] cursor-pointer"
                title="Clear Console Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDownloadLogs}
                className="apple-pressable p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] cursor-pointer"
                title="Export Logs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {runState.isRunning && (
                <button
                  type="button"
                  onClick={onStopAgent}
                  className="apple-pressable px-3 py-1 bg-[#FF453A] hover:bg-[#FF554A] text-white rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Stop Agent</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggle}
                className="apple-pressable p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] cursor-pointer"
                title="Collapse Console"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Console Log Stream */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5 text-[12px] font-mono leading-relaxed custom-scrollbar select-text"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-500 py-8 text-center font-sans text-[13px]">
                No agent execution logs yet. Click &ldquo;Build CapCut Draft&rdquo; to stream live stdout/stderr events from Hermes, Claude Code, or OpenCode.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-baseline gap-3 py-1 border-b border-white/[0.04] ${
                    log.type === 'ERROR' ? 'text-[#FF453A]' : 'text-zinc-300'
                  }`}
                >
                  <span className="text-zinc-500 shrink-0 tabular-nums">
                    {log.timestamp}
                  </span>
                  <span className="w-24 shrink-0">
                    {getStageLabel(log.type)}
                  </span>
                  {log.scene_id && (
                    <span className="text-[#0A84FF] shrink-0 tabular-nums">
                      {log.scene_id}
                    </span>
                  )}
                  <span className="flex-1 break-words">
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
