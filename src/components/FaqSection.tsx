/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldQuestion, Heart } from 'lucide-react';
import { FAQ_ITEMS } from '../data';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div id="faq-section" className="w-full text-right bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl space-y-6 scroll-mt-20 z-10 relative">
      
      {/* FAQ Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <ShieldQuestion className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">الأسئلة الشائعة والأجوبة الطبية المبسطة</h2>
          <p className="text-xs text-slate-400 font-medium">
            تجد هنا إجابات علمية شاملة لتبديد مخاوفك ومساعدتك في اتخاذ القرار الطبي الصحيح لحماية طفلك.
          </p>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? 'border-teal-500/30 bg-teal-500/5 shadow-lg shadow-teal-950/20'
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Question Trigger */}
              <button
                onClick={() => toggleIndex(index)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-right outline-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isOpen ? 'bg-teal-500 text-white' : 'bg-white/10 text-slate-300'
                  }`}>
                    ؟
                  </span>
                  <span className="text-sm font-black text-white leading-snug">
                    {item.question}
                  </span>
                </div>
                
                <span className={`shrink-0 rounded-full p-1 transition-transform ${
                  isOpen ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {/* Answer Content */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium border-t border-white/5 mt-1 whitespace-pre-line animate-fade-in">
                  {item.answer}
                  
                  {/* Gentle assurance notice inside each answer */}
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-500/10 p-2.5 border border-teal-500/20 max-w-fit">
                    <Heart className="h-3.5 w-3.5 text-teal-400 fill-teal-500/20" />
                    <span className="text-[10px] text-teal-300 font-semibold">
                      الوقاية المبكرة تصنع فارقاً حقيقياً في حياة أطفالنا.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
