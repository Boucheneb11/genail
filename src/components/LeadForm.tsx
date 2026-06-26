/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Phone, Calendar, Heart, Send, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CITIES_LIST } from '../data';
import { Lead } from '../types';

interface LeadFormProps {
  onSubmitSuccess: (newLead: Lead) => void;
}

export default function LeadForm({ onSubmitSuccess }: LeadFormProps) {
  const [parentName, setParentName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+213');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childAge, setChildAge] = useState<Lead['childAge']>('6-12m');
  const [hadFeverBefore, setHadFeverBefore] = useState<Lead['hadFeverBefore']>('no');
  const [city, setCity] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredCities = CITIES_LIST.filter(c => 
    c.toLowerCase().includes(city.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!parentName.trim()) {
      setError('يرجى كتابة اسم ولي الأمر الكريم.');
      return;
    }
    if (parentName.trim().length < 3) {
      setError('يرجى كتابة الاسم الثلاثي أو الثنائي لولي الأمر.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('يرجى إدخال رقم الهاتف الجوال للتواصل.');
      return;
    }
    
    // Validate phone number digits (usually 7-10 digits)
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^\d{7,10}$/.test(cleanPhone)) {
      setError('يرجى إدخال رقم هاتف صحيح يتكون من 7 إلى 10 أرقام (دون رمز الدولة).');
      return;
    }

    if (!city.trim()) {
      setError('يرجى اختيار أو كتابة المدينة/الولاية السكنية.');
      return;
    }

    setIsSubmitting(true);

    // Simulate database saving or API write (we store in LocalStorage for persistence)
    setTimeout(() => {
      const newLead: Lead = {
        id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        parentName: parentName.trim(),
        phoneNumber: `${phoneCode} ${cleanPhone}`,
        childAge,
        hadFeverBefore,
        city: city.trim(),
        createdAt: new Date().toISOString()
      };

      try {
        const existingLeads: Lead[] = JSON.parse(localStorage.getItem('hope_leads') || '[]');
        existingLeads.unshift(newLead);
        localStorage.setItem('hope_leads', JSON.stringify(existingLeads));

        // Background Google Sheets auto-sync
        const gToken = sessionStorage.getItem('g_sheets_token');
        const gSheetId = localStorage.getItem('hope_spreadsheet_id');
        const isAutoSync = localStorage.getItem('hope_auto_sync') === 'true';

        if (gToken && gSheetId && isAutoSync) {
          const ageMap: Record<string, string> = {
            'less-than-6m': 'أقل من 6 أشهر',
            '6-12m': '6-12 شهراً',
            '1-3y': '1-3 سنوات',
            'more-than-3y': 'أكثر من 3 سنوات'
          };
          const feverMap: Record<string, string> = {
            'yes': 'نعم',
            'no': 'لا',
            'not-sure': 'غير متأكد'
          };

          fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gSheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [[
                newLead.parentName,
                newLead.phoneNumber,
                ageMap[newLead.childAge] || newLead.childAge,
                feverMap[newLead.hadFeverBefore] || newLead.hadFeverBefore,
                newLead.city,
                new Date(newLead.createdAt).toLocaleString('ar-DZ')
              ]],
            }),
          }).catch(err => console.error('Auto sync to Google Sheets failed:', err));
        }
      } catch (err) {
        console.error('LocalStorage error:', err);
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      // Trigger callback with small delay to let success animation finish
      setTimeout(() => {
        onSubmitSuccess(newLead);
      }, 1500);
    }, 800);
  };

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl text-right">
      {/* Header section with warm heart icon */}
      <div className="bg-gradient-to-l from-teal-500 to-emerald-500 p-6 text-white text-center border-b border-white/10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          <Heart className="h-6 w-6 fill-white text-white animate-pulse" />
        </div>
        <h2 className="text-xl font-black sm:text-2xl bg-clip-text text-transparent bg-gradient-to-l from-white to-teal-100">سجل اهتمامك الآن للحصول على الدعم</h2>
        <p className="mt-1.5 text-xs text-teal-100/90 sm:text-sm">
          انضم لعائلات "رعاية الأمل" واستلم فوراً الدليل التفصيلي المطبوع بالإضافة لحجز مقعدك في الندوة المباشرة لحماية طفلك.
        </p>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8">
        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-scale-up" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">نشكر اهتمامك وحرصك</h3>
              <p className="text-sm text-slate-300">
                لقد تم تسجيل بياناتك بنجاح. سيتم الآن توجيهك فوراً إلى القسم التعليمي والتحسيسي التفاعلي ودليل الإسعاف المخصص لطفلك...
              </p>
            </div>
            <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-400 rounded-full animate-progress" style={{ width: '100%' }}></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 border border-rose-500/20 overflow-hidden"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <p className="self-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parent Name */}
            <motion.div 
              className="space-y-1.5"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <label htmlFor="parentName" className="block text-sm font-bold text-teal-400">
                اسم ولي الأمر الكامل <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <motion.input
                  type="text"
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(20, 184, 166, 0.2)" }}
                  transition={{ duration: 0.15 }}
                  placeholder="مثال: أحمد العبدالله"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-teal-500/50 focus:bg-white/10"
                />
              </div>
            </motion.div>

            {/* Phone Number */}
            <motion.div 
              className="space-y-1.5"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <label htmlFor="phoneNumber" className="block text-sm font-bold text-teal-400">
                رقم الهاتف الجوال <span className="text-rose-400">*</span>
              </label>
              <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:border-teal-500/50 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                {/* Code Selector */}
                <select
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="bg-slate-900/90 text-white px-3 py-2.5 text-xs font-bold border-l border-white/10 outline-none"
                  dir="ltr"
                >
                  <option value="+213" className="bg-slate-950">+213 الجزائر</option>
                  <option value="+216" className="bg-slate-950">+216 تونس</option>
                  <option value="+212" className="bg-slate-950">+212 المغرب</option>
                </select>
                {/* Input */}
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <motion.input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                    placeholder="مثال: 550123456"
                    className="block w-full py-2.5 pr-10 pl-3 text-sm text-white bg-transparent outline-none placeholder:text-slate-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mr-1">
                الرجاء إدخال الرقم بدون الصفر الأول وبدون رمز الدولة (مثال بالجزائر: 5XXXXXXXX أو 6XXXXXXXX)
              </p>
            </motion.div>

            {/* City/State with suggestions */}
            <motion.div 
              className="space-y-1.5 relative"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <label htmlFor="city" className="block text-sm font-bold text-teal-400">
                المنطقة / المدينة / الولاية السكنية <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <motion.input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => {
                    // Delay to allow clicking on list items
                    setTimeout(() => setShowCitySuggestions(false), 200);
                  }}
                  whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(20, 184, 166, 0.2)" }}
                  transition={{ duration: 0.15 }}
                  placeholder="ابتدئ بكتابة ولايتك مثل: الجزائر، وهران، قسنطينة..."
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-teal-500/50 focus:bg-white/10"
                />
              </div>
              
              <AnimatePresence>
                {showCitySuggestions && filteredCities.length > 0 && (
                  <motion.ul 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-900 py-1 shadow-2xl text-right text-xs"
                  >
                    {filteredCities.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          onMouseDown={() => setCity(c)}
                          className="w-full px-4 py-2 text-right text-slate-100 hover:bg-teal-500/20 hover:text-teal-300 font-medium transition-colors"
                        >
                          {c}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Grid of Child Age & Previous Fever */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Child Age Group */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-teal-400">
                  الفئة العمرية للطفل <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'less-than-6m', label: 'أقل من 6 أشهر' },
                    { id: '6-12m', label: '6 - 12 شهراً' },
                    { id: '1-3y', label: '1 - 3 سنوات' },
                    { id: 'more-than-3y', label: 'أكثر من 3 سنوات' }
                  ].map((option) => (
                    <motion.label
                      key={option.id}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                        childAge === option.id
                          ? 'border-teal-500 bg-teal-500/20 text-teal-300 ring-2 ring-teal-500/20'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="childAge"
                        value={option.id}
                        checked={childAge === option.id}
                        onChange={() => setChildAge(option.id as Lead['childAge'])}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Faced Fever Before */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-teal-400">
                  هل واجه الطفل حمى سابقاً؟ <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'yes', label: 'نعم' },
                    { id: 'no', label: 'لا' },
                    { id: 'not-sure', label: 'غير متأكد' }
                  ].map((option) => (
                    <motion.label
                      key={option.id}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                        hadFeverBefore === option.id
                          ? 'border-teal-500 bg-teal-500/20 text-teal-300 ring-2 ring-teal-500/20'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hadFeverBefore"
                        value={option.id}
                        checked={hadFeverBefore === option.id}
                        onChange={() => setHadFeverBefore(option.id as Lead['hadFeverBefore'])}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                    </motion.label>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer & Submit Button */}
            <div className="pt-3">
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                خصوصيتكم محل اهتمامنا. يتم استخدام هذه البيانات للخدمة التعليمية والتواصل الإرشادي من قبل ممثلي "رعاية الأمل" فقط، ولن يتم مشاركتها مطلقاً مع أي جهة خارجية.
              </p>
              
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-teal-500 to-emerald-500 py-3 text-sm font-bold text-white shadow-xl shadow-teal-500/20 transition-all hover:from-teal-400 hover:to-emerald-400 hover:shadow-2xl disabled:from-teal-700 disabled:to-emerald-700 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>جاري حفظ اهتمامك وتوليد الدليل...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 shrink-0 rotate-180" />
                    <span>تأكيد التسجيل وتحميل دليل الطوارئ التفاعلي</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
