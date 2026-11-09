import React from 'react';
import { motion } from 'motion/react';
import { Play, Square } from 'lucide-react';
import { AgentRunState } from '../types/documentary';

interface HeaderProps {
  runState: AgentRunState;
  activeNav: 'workspace' | 'style' | 'directives' | 'console';
  onSelectNav: (nav: 'workspace' | 'style' | 'directives' | 'console') => void;
  onRunAgent: () => void;
  onStopAgent: () => void;
  sceneCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  runState,
  activeNav,
  onSelectNav,
  onRunAgent,
  onStopAgent,
  sceneCount
}) => {
  const navItems: Array<{ id: 'workspace' | 'style' | 'directives' | 'console'; label: string }> = [
    { id: 'workspace', label: `Storyboard (${sceneCount})` },
    { id: 'style', label: 'Style Profile' },
    { id: 'directives', label: 'Directives' },
    { id: 'console', label: 'Console' }
  ];

  return (
    <header className="h-14 apple-glass-chrome px-6 flex items-center justify-between gap-8 select-none z-30 sticky top-0">
      {/* Zone 1: Single-line Brand Wordmark */}
      <a
        href="#workspace"
        onClick={(e) => {
          e.preventDefault();
          onSelectNav('workspace');
        }}
        className="apple-title-md text-[15px] font-semibold text-[#F5F5F7] whitespace-nowrap shrink-0 apple-pressable"
      >
        StenGen
      </a>

      {/* Zone 2: Fluid Spring-Animated Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`relative px-3.5 py-1 text-[13px] font-medium rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer apple-pressable ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="header-nav-pill"
                  transition={{ type: 'spring', bounce: 0, duration: 0.36 }}
                  className="absolute inset-0 rounded-full bg-white/[0.12] border border-white/[0.14] shadow-xs"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action with Pointer-Down Tactility & Specular Highlight */}
      <div className="flex items-center shrink-0">
        {runState.isRunning ? (
          <button
            type="button"
            onClick={onStopAgent}
            className="apple-pressable px-4 py-1.5 bg-[#FF453A] hover:bg-[#FF554A] text-white rounded-full text-[13px] font-semibold flex items-center gap-2 border-t border-white/25 shadow-md shadow-red-950/40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Stop Agent</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRunAgent}
            className="apple-pressable px-4 py-1.5 bg-[#0A84FF] hover:bg-[#1B8EFF] text-white rounded-full text-[13px] font-semibold flex items-center gap-2 border-t border-white/30 shadow-md shadow-blue-950/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Build CapCut Draft</span>
          </button>
        )}
      </div>
    </header>
  );
};
