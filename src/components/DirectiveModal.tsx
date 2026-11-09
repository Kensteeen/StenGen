import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { ProjectManifest } from '../types/documentary';
import {
  generateAgentsMarkdown,
  generateClaudeMarkdown,
  generateHermesPrompt,
  generateHermesCommand
} from '../utils/templates';

interface DirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: ProjectManifest;
}

export const DirectiveModal: React.FC<DirectiveModalProps> = ({
  isOpen,
  onClose,
  manifest
}) => {
  const [activeTab, setActiveTab] = useState<'hermes' | 'agents' | 'claude' | 'manifest'>('hermes');
  const [copied, setCopied] = useState(false);

  const hermesPrompt = generateHermesPrompt();
  const hermesCmd = generateHermesCommand(manifest.agent_config.custom_flags || '');
  const hermesPreviewContent = `# File: <workspace_dir>/hermes_prompt.txt\n${hermesPrompt}\n\n# Spawned CLI Command (with HERMES_YOLO_MODE=1 in env)\nHERMES_YOLO_MODE=1 ${hermesCmd}`;

  const agentsMd = generateAgentsMarkdown(manifest as any);
  const claudeMd = generateClaudeMarkdown(manifest as any);
  const manifestJson = JSON.stringify(manifest, null, 2);

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'hermes':
        return hermesPreviewContent;
      case 'agents':
        return agentsMd;
      case 'claude':
        return claudeMd;
      case 'manifest':
        return manifestJson;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: Array<{ id: 'hermes' | 'agents' | 'claude' | 'manifest'; label: string }> = [
    { id: 'hermes', label: 'hermes_prompt.txt & CLI' },
    { id: 'agents', label: 'AGENTS.md' },
    { id: 'claude', label: 'CLAUDE.md' },
    { id: 'manifest', label: 'manifest.json' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none"
        >
          {/* Materialize Surface (§12: scale + opacity spring) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
            onClick={(e) => e.stopPropagation()}
            className="apple-glass-card rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="apple-title-md text-[15px] font-semibold text-[#F5F5F7]">
                  Agent Directives &amp; Manifest Inspector
                </h2>
                <p className="apple-caption text-[12px] text-zinc-400 mt-0.5">
                  Auto-generated files written into your workspace directory for Hermes, Claude Code, and OpenCode
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="apple-pressable px-3.5 py-1.5 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl text-[12px] font-medium flex items-center gap-1.5 border border-white/[0.12] border-t-white/25 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Content'}</span>
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

            {/* Spring Segmented Tabs */}
            <div className="px-6 py-2.5 border-b border-white/[0.07] bg-black/30 flex items-center gap-1.5 overflow-x-auto">
              {tabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 py-1.5 text-[12px] font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer apple-pressable ${
                      isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="directive-modal-pill"
                        transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
                        className="absolute inset-0 rounded-xl bg-white/[0.13] border-t border-white/20"
                      />
                    )}
                    <span className="relative z-10 font-mono">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/45 custom-scrollbar">
              <pre className="font-mono text-[12px] text-zinc-200 whitespace-pre-wrap select-text leading-relaxed">
                {getCurrentContent()}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/[0.08] text-[12px] text-zinc-400 flex items-center justify-between">
              <span>
                Target Workspace: <code className="text-zinc-200 font-mono">{manifest.workspace_dir || './workspace_project'}</code>
              </span>
              <span className="text-zinc-500">
                Written automatically on Save Manifest and Build CapCut Draft
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
