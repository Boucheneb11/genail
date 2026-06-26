/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Play, AlertOctagon, Video, Info, Sparkles, Lock } from 'lucide-react';
import { VIDEO_SLIDES } from '../data';

interface VideoCarouselProps {
  isRegistered: boolean;
  onPromptRegistration: () => void;
}

export default function VideoCarousel({ isRegistered, onPromptRegistration }: VideoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isRegistered) {
      onPromptRegistration();
      return;
    }
    setActiveIndex((prev) => (prev + 1) % VIDEO_SLIDES.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isRegistered) {
      onPromptRegistration();
      return;
    }
    setActiveIndex((prev) => (prev - 1 + VIDEO_SLIDES.length) % VIDEO_SLIDES.length);
  };

  const currentSlide = VIDEO_SLIDES[activeIndex];

  return (
    <div 
      className="w-full text-right bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl space-y-6 z-10 relative overflow-hidden"
      onClick={() => {
        if (!isRegistered) onPromptRegistration();
      }}
    >
      
      {/* Section Header */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Video className="h-5.5 w-5.5 text-teal-400" />
            <span>المكتبة المرئية: دليلك المبسط لحماية طفلك</span>
            {isRegistered && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                مفتوحة ومفعلة ✓
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            شاهد العروض التوعوية المعتمدة من أطباء الأطفال واستمع لأهم التعليمات الطبية.
          </p>
        </div>
        
        {/* Navigation Indicator & Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-bold text-slate-400">
            {activeIndex + 1} من {VIDEO_SLIDES.length}
          </span>
          <div className="flex gap-1.5" dir="ltr">
            <button
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95 transition-all"
              aria-label="السابق"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95 transition-all"
              aria-label="التالي"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Body Container with Relative position to handle lock overlay */}
      <div className="relative">
        {/* Lock Overlay for Unregistered Users */}
        {!isRegistered && (
          <div 
            className="absolute -inset-4 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 transition-all cursor-pointer group hover:bg-slate-950/90"
            onClick={(e) => {
              e.stopPropagation();
              onPromptRegistration();
            }}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform duration-300 animate-pulse">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-white sm:text-lg">هذا المحتوى التوعوي مغلق مؤقتاً</h3>
            <p className="mt-2 max-w-md text-xs font-semibold text-slate-300 leading-relaxed">
              تتطلب المكتبة المرئية تسجيل اهتمامك أولاً لتفعيل كافة العروض التثقيفية والتعليمية المخصصة مجاناً.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-teal-500 to-emerald-500 px-5 py-2.5 text-xs font-black text-white shadow-xl shadow-teal-500/20 group-hover:from-teal-400 group-hover:to-emerald-400 hover:shadow-2xl transition-all">
              <span>سجل الآن لفتح المكتبة المرئية فوراً</span>
              <span>←</span>
            </span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-12 items-center">
          
          {/* Playback Simulation Graphic (5 Columns) */}
          <div className="md:col-span-5">
            <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br ${currentSlide.bgGradient} border border-white/10 p-4 shadow-inner flex flex-col justify-between group cursor-pointer`}>
              
              {/* Watermark Logo */}
              <div className="flex justify-between items-center text-slate-300/85 text-[9px] font-bold">
                <span className="bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-teal-400 flex items-center gap-1 border border-white/5">
                  <Sparkles className="h-3 w-3" />
                  رعاية الأمل
                </span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-slate-300">توجيه مرئي</span>
              </div>

              {/* Glowing Big Play Button */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg transition-transform group-hover:scale-110 shadow-teal-500/30 border border-white/20">
                <Play className="h-6 w-6 fill-white text-white ml-1" />
              </div>

              {/* Subtitle bottom banner */}
              <div className="rounded-lg bg-slate-950/85 backdrop-blur-sm p-2 text-center text-[10px] font-bold text-white tracking-wide border border-white/5">
                {currentSlide.title}
              </div>

              {/* Play overlay shimmer on hover */}
              <div className="absolute inset-0 bg-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>

          {/* Presentation Content Description (7 Columns) */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-teal-400 tracking-wider block">الموضوع التوعوي المختار:</span>
              <h3 className="text-base font-black text-white sm:text-lg">
                {currentSlide.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {currentSlide.description}
              </p>
            </div>

            {/* Urgent Clinical Alert Box inside the slide */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 flex items-start gap-3">
              <AlertOctagon className="h-5 w-5 shrink-0 text-red-400 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-red-300">تنبيه وإرشاد وقائي هام:</span>
                <p className="text-xs text-red-200 leading-relaxed font-semibold">
                  {currentSlide.alertText}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Progress Dots navigation */}
      <div className="flex justify-center gap-1.5 pt-2">
        {VIDEO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (!isRegistered) {
                onPromptRegistration();
                return;
              }
              setActiveIndex(idx);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex ? 'w-6 bg-teal-400' : 'w-2 bg-white/10'
            }`}
            aria-label={`الشريحة ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
