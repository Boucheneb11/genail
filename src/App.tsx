/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Shield, AlertCircle, Sparkles, Phone, ShieldCheck, CheckCircle2,
  ChevronDown, ArrowLeft, ArrowUpRight, HelpCircle, Activity 
} from 'lucide-react';

import { Lead } from './types';
import Header from './components/Header';
import CountdownTimer from './components/CountdownTimer';
import LeadForm from './components/LeadForm';
import VideoCarousel from './components/VideoCarousel';
import FaqSection from './components/FaqSection';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  // Check if there is an existing registered lead in this browser to welcome them back!
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hope_leads');
      if (stored) {
        const leads: Lead[] = JSON.parse(stored);
        if (leads.length > 0) {
          // Use the most recent lead as current default
          setCurrentLead(leads[0]);
        }
      }
    } catch (err) {
      console.error('Failed to parse leads on load', err);
    }
  }, []);

  const handlePromptRegistration = () => {
    scrollToSection(formRef);
  };

  const handleLeadSubmitSuccess = (lead: Lead) => {
    setCurrentLead(lead);
    
    // Smooth scroll to educational library after registration
    setTimeout(() => {
      scrollToSection(videoRef);
    }, 1200);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleAdmin = () => {
    setIsAdminActive(prev => !prev);
    // Scroll to top of screen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100 flex flex-col overflow-x-hidden relative select-none selection:bg-teal-500/30 selection:text-teal-200" dir="rtl">
      
      {/* Background Decor */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] z-0"></div>
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] z-0"></div>
      
      {/* 1. Header Navigation */}
      <Header 
        isAdminActive={isAdminActive} 
        onToggleAdmin={handleToggleAdmin}
        onScrollToFaq={() => scrollToSection(faqRef)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        <AnimatePresence mode="wait">
          {isAdminActive ? (
            /* Admin Panel Page */
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              <AdminDashboard />
            </motion.div>
          ) : (
            /* Main Landing Page View */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              {/* Hero & Lead Registration Section */}
              <section className="grid gap-8 items-center lg:grid-cols-12">
                
                {/* Hero Left Column (Information and Copy) - 7 Columns */}
                <div className="lg:col-span-7 space-y-6 text-right z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400 border border-teal-500/20">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>المنصة التثقيفية الأولى بالجزائر لسلامة وحماية الأطفال</span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
                    لأن كُلّ <span className="bg-clip-text text-transparent bg-gradient-to-l from-teal-400 to-emerald-400 font-extrabold animate-pulse">نبضة أمل</span> تعني الكثير...
                    <span className="block mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-l from-white via-teal-100 to-teal-300">
                      نحمي عقل طفلك عند ارتفاع درجات الحرارة
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                    الأطفال الذين عانوا من <span className="text-teal-400 font-bold">نقص الأكسجين عند الولادة</span> تكون خلاياهم العصبية أكثر حساسية وعرضة للإثارة. الارتفاع السريع أو الشديد في درجات الحرارة (الحمى) ليس مجرد عَرَض عابر؛ بل يضاعف خطر حدوث التشنجات الحرارية وتلف الخلايا الضعيفة مسبقاً.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs font-bold text-slate-200">
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 shadow-lg">
                      <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <span>تعليمات إسعافية فورية</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 shadow-lg">
                      <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span>عروض توعوية مرئية</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 shadow-lg">
                      <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400">
                        <HelpCircle className="h-4 w-4" />
                      </div>
                      <span>إرشاد وقائي متكامل</span>
                    </div>
                  </div>

                  {/* Countdown Timer Widget */}
                  <CountdownTimer />

                  {/* Bypass / Quick Navigation Button */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => scrollToSection(videoRef)}
                      className="text-xs font-extrabold text-teal-400 hover:text-teal-300 flex items-center gap-1 group"
                    >
                      <span>الانتقال المباشر للمكتبة المرئية والتوجيهات الطبية</span>
                      <span className="transition-transform group-hover:-translate-x-1">←</span>
                    </button>
                  </div>
                </div>

                {/* Hero Right Column (Lead Form Card) - 5 Columns */}
                <div className="lg:col-span-5" ref={formRef}>
                  <LeadForm onSubmitSuccess={handleLeadSubmitSuccess} />
                </div>

              </section>

              {/* 2. Educational Video Cards Section */}
              <section ref={videoRef} className="scroll-mt-20">
                <VideoCarousel 
                  isRegistered={!!currentLead} 
                  onPromptRegistration={handlePromptRegistration} 
                />
              </section>

              {/* 4. FAQs Accordion Section */}
              <section ref={faqRef} className="scroll-mt-20">
                <FaqSection />
              </section>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Details */}
      <footer className="mt-16 bg-black/40 backdrop-blur-md border-t border-white/10 py-12 text-center text-xs text-slate-300 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Heart Emblem Footer logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-teal-200">رعاية الأمل</span>
          </div>

          {/* Guidelines disclaimer (Crucial safety standard) */}
          <div className="mx-auto max-w-3xl rounded-2xl bg-rose-500/10 p-5 border border-rose-500/20 text-[11px] text-slate-200 leading-relaxed font-semibold">
            <div className="flex justify-center gap-1.5 items-center mb-2 text-rose-400 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>تنبيه وإخلاء مسؤولية طبي هام</span>
            </div>
            محتوى هذا الموقع، بما في ذلك المحاكي وأدوات حساب الجرعات، هو لغرض التوعية والتثقيف والإرشاد الأسري فقط. هذه المعادلات الحسابية والتقييمات لا تعتبر تشخيصاً طبياً مستقلاً، ولا تغني مطلقاً عن مراجعة الطبيب المختص أو الاتصال الفوري بالإسعاف في الحالات الحرجة جداً أو عند ظهور أعراض خطورة كالتشنجات وصعوبة التنفس.
          </div>

          {/* Links and Contact Details */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-bold text-slate-400">
            <span>الجمعية الجزائرية للتوعية والوقاية من مضاعفات نقص الأكسجين الدماغي للأطفال</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-teal-400" />
              <span>أرقام الطوارئ الطبية والحماية المدنية بالجزائر: <span className="text-white">14 / 115</span></span>
            </span>
            <span>•</span>
            <span>دليل إدارة الحمى المنزلي المعتمد بالجزائر ٢٠٢٦</span>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            جميع الحقوق محفوظة © الجمعية الجزائرية للتوعية والوقاية - رعاية الأمل الجزائر {new Date().getFullYear()}
          </p>

        </div>
      </footer>

    </div>
  );
}
