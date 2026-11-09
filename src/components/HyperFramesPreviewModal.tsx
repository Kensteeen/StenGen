import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { Scene } from '../types/documentary';

interface HyperFramesPreviewModalProps {
  scene: Scene | null;
  onClose: () => void;
}

export const HyperFramesPreviewModal: React.FC<HyperFramesPreviewModalProps> = ({
  scene,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const isVisible = Boolean(scene && scene.visual_mode === 'motion_graphic');
  const promptDescription = scene?.motion_graphic_config?.prompt || scene?.narration_text || 'Motion Graphic Sequence';
  const themeLabel = scene?.motion_graphic_config?.style_theme || 'Dark Slate Telemetry';

  const defaultHtml = scene?.motion_graphic_config?.preview_html || `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #09090B;
      color: #F5F5F7;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100vh;
      box-sizing: border-box;
      padding: 32px;
      overflow: hidden;
    }
    .header {
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #A1A1AA;
      font-family: monospace;
    }
    .canvas {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .ring {
      position: absolute;
      width: 240px;
      height: 240px;
      border: 1px solid rgba(10, 132, 255, 0.35);
      border-radius: 50%;
      animation: expand 3s infinite ease-out;
    }
    .content-box {
      z-index: 10;
      max-width: 520px;
    }
    .theme-kicker {
      font-size: 12px;
      color: #0A84FF;
      font-family: monospace;
      margin-bottom: 8px;
    }
    .prompt-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.015em;
      color: #F5F5F7;
      line-height: 1.45;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #71717A;
      font-family: monospace;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 12px;
    }
    @keyframes expand {
      0% { transform: scale(0.85); opacity: 0.9; }
      100% { transform: scale(1.35); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span>Scene ${String(scene?.scene_number ?? 1).padStart(2, '0')} (${scene?.id ?? 'SCN_01'})</span>
    <span>1920×1080 · 60fps</span>
  </div>
  <div class="canvas">
    <div class="ring"></div>
    <div class="content-box">
      <div class="theme-kicker">${themeLabel}</div>
      <div class="prompt-title">${promptDescription}</div>
    </div>
  </div>
  <div class="footer">
    <span>HyperFrames HTML/CSS Renderer</span>
    <span>Duration: ${scene?.duration_sec ?? 5}s</span>
  </div>
</body>
</html>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(defaultHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && scene && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
            onClick={(e) => e.stopPropagation()}
            className="apple-glass-card rounded-3xl w-full max-w-4xl h-[75vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="apple-title-md text-[15px] font-semibold text-[#F5F5F7]">
                  HyperFrames Motion Graphic Preview · Scene {String(scene.scene_number).padStart(2, '0')}
                </h2>
                <p className="apple-caption text-[12px] text-zinc-400 mt-0.5">
                  Deterministic HTML/CSS/SVG animation rendered to 60fps MP4
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-black/45 border border-white/[0.08] rounded-xl p-1 text-[12px]">
                  {(['preview', 'code'] as const).map((mode) => {
                    const isSelected = viewMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`relative px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer apple-pressable ${
                          isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="hyperframes-modal-pill"
                            transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
                            className="absolute inset-0 rounded-lg bg-white/[0.13] border-t border-white/20"
                          />
                        )}
                        <span className="relative z-10">
                          {mode === 'preview' ? 'Live Canvas' : 'HTML/CSS Source'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="apple-pressable px-3.5 py-1.5 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl text-[12px] font-medium flex items-center gap-1.5 border border-white/[0.12] border-t-white/25 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="apple-pressable p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-black/50 overflow-hidden flex items-center justify-center p-6">
              {viewMode === 'preview' ? (
                <div className="w-full h-full max-w-3xl aspect-video rounded-2xl overflow-hidden border border-white/[0.1] bg-[#09090B]">
                  <iframe
                    title="HyperFrames Animation Preview"
                    srcDoc={defaultHtml}
                    sandbox="allow-scripts"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="w-full h-full overflow-y-auto p-4 bg-black/60 rounded-2xl border border-white/[0.08] custom-scrollbar">
                  <pre className="font-mono text-[12px] text-zinc-200 whitespace-pre-wrap select-text leading-relaxed">
                    {defaultHtml}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
