/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Heart, HelpCircle, Lock, LayoutDashboard, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  isAdminActive: boolean;
  onToggleAdmin: () => void;
  onScrollToFaq: () => void;
}

export default function Header({ isAdminActive, onToggleAdmin, onScrollToFaq }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-lg transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6" />
              <Heart className="absolute h-3 w-3 fill-white text-teal-200 animate-pulse" style={{ top: '35%', left: '35%' }} />
            </div>
            
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-teal-200 sm:text-lg">
                رعاية الأمل
              </span>
              <span className="text-[10px] font-medium text-teal-400 opacity-80 sm:text-xs uppercase tracking-wider">
                الجمعية الجزائرية للتوعية والوقاية
              </span>
            </div>
          </div>

          {/* Guidelines Badge */}
          <div className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>توجيهات معتمدة طبياً ✓</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isAdminActive && (
              <button
                onClick={onScrollToFaq}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-teal-400 transition-colors sm:px-3 sm:text-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span>الأسئلة الشائعة</span>
              </button>
            )}

            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-md sm:text-sm ${
                isAdminActive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'
              }`}
            >
              {isAdminActive ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>العودة للتوعية</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>لوحة الإدارة</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
      
      {/* Small Screen Badge */}
      <div className="flex justify-center border-t border-white/5 bg-emerald-500/5 py-1 sm:hidden">
        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          توجيهات معتمدة من الجمعية الجزائرية للتوعية
        </span>
      </div>
    </header>
  );
}
