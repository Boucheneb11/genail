/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Video, Users, Bell } from 'lucide-react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 45,
    seconds: 10,
  });

  // Calculate dynamic countdown so it is always active and urgent
  useEffect(() => {
    // Generate a target date which is always roughly 14 hours and 45 minutes from when they loaded,
    // but cached in sessionStorage so it counts down properly on reload!
    const cacheKey = 'hope_webinar_target';
    let targetTime = sessionStorage.getItem(cacheKey);
    
    if (!targetTime) {
      const now = new Date();
      // set target to 14 hours, 45 minutes, 10 seconds from now
      const future = new Date(now.getTime() + (14 * 60 * 60 * 1000) + (45 * 60 * 1000) + (10 * 1000));
      targetTime = future.getTime().toString();
      sessionStorage.setItem(cacheKey, targetTime);
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = parseInt(targetTime!) - now;

      if (difference <= 0) {
        // Reset to next day if expired
        const newFuture = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
        sessionStorage.setItem(cacheKey, newFuture.getTime().toString());
        return;
      }

      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours: h, minutes: m, seconds: s });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl text-right z-10 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Webinar Meta Information */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-bounce">
            <Video className="h-3 w-3" />
            <span>بث مباشر توعوي مجاني</span>
          </div>
          
          <h3 className="text-base font-extrabold text-white sm:text-lg">
            ندوة تفاعلية: الإساب المنزلي السريع للحمى والتشنج الحراري
          </h3>
          
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            ينظم المركز الوطني ندوة تدريبية تفاعلية مخصصة لأولياء أمور أطفال نقص الأكسجين لتدريبهم على قياس الحرارة الدقيق واستخدام الكمادات وخافضات الحرارة بأمان لمنع أي نوبات صرعية.
          </p>
          
          <div className="mt-1 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-400" />
              <span>اليوم، عبر منصة زووم التفاعلية</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-teal-400" />
              <span>متاح لـ 500 ولي أمر فقط (الأولوية للمسجلين بالصفحة)</span>
            </span>
          </div>
        </div>

        {/* Countdown Visuals */}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 p-4 border border-white/5 shadow-inner min-w-[200px] sm:self-center">
          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5 text-teal-400 animate-swing" />
            <span>يغلق التسجيل التلقائي خلال:</span>
          </span>
          
          <div className="flex gap-2" dir="ltr">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-teal-400 border border-white/5 shadow-inner">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="mt-1 text-[9px] font-bold text-slate-400">ساعة</span>
            </div>
            
            <span className="text-lg font-black text-slate-500 self-center -mt-4">:</span>
            
            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-teal-400 border border-white/5 shadow-inner">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="mt-1 text-[9px] font-bold text-slate-400">دقيقة</span>
            </div>
            
            <span className="text-lg font-black text-slate-500 self-center -mt-4">:</span>
            
            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500 text-lg font-black text-white shadow-lg animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className="mt-1 text-[9px] font-bold text-slate-400">ثانية</span>
            </div>
          </div>
          
          <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
            ✓ التسجيل عبر النموذج بالأسفل يضمن مقعدك تلقائياً
          </span>
        </div>

      </div>
    </div>
  );
}
