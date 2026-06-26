/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, Users, Calendar, HelpCircle, MapPin, Trash2, 
  Download, LogOut, Search, Info, ShieldAlert, CheckCircle, Database 
} from 'lucide-react';
import { Lead } from '../types';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load leads from LocalStorage on mount/auth
  useEffect(() => {
    if (isAuthenticated) {
      loadLeadsFromStorage();
    }
  }, [isAuthenticated]);

  const loadLeadsFromStorage = () => {
    try {
      const stored = localStorage.getItem('hope_leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error('Failed to read leads from storage', err);
    }
  };

  // Pre-populate with beautiful, realistic mock data for easy testing!
  const handleInjectMockData = () => {
    const mockLeads: Lead[] = [
      {
        id: 'mock_1',
        parentName: 'سليم بن عيسى',
        phoneNumber: '+213 550123456',
        childAge: 'less-than-6m',
        hadFeverBefore: 'no',
        city: 'الجزائر العاصمة',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'mock_2',
        parentName: 'نور الهدى بلقاسم',
        phoneNumber: '+213 661987654',
        childAge: '6-12m',
        hadFeverBefore: 'yes',
        city: 'وهران',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'mock_3',
        parentName: 'محمد الأمين مخلوفي',
        phoneNumber: '+213 770123456',
        childAge: '1-3y',
        hadFeverBefore: 'not-sure',
        city: 'قسنطينة',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'mock_4',
        parentName: 'فاطمة الزهراء عيسات',
        phoneNumber: '+213 552345678',
        childAge: 'more-than-3y',
        hadFeverBefore: 'yes',
        city: 'عنابة',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      },
      {
        id: 'mock_5',
        parentName: 'عبد القادر جبار',
        phoneNumber: '+213 663456789',
        childAge: 'less-than-6m',
        hadFeverBefore: 'no',
        city: 'البليدة',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
      }
    ];

    try {
      localStorage.setItem('hope_leads', JSON.stringify(mockLeads));
      setLeads(mockLeads);
      showTemporarySuccess('تم حقن بيانات تجريبية واقعية بنجاح للتقييم والتصدير!');
    } catch (err) {
      console.error(err);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Handle Login Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (passcode === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة! يرجى إدخال (admin123) للدخول.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Delete individual lead
  const handleDeleteIndividual = (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    localStorage.setItem('hope_leads', JSON.stringify(updated));
    setLeads(updated);
    setDeleteConfirmId(null);
    showTemporarySuccess('تم حذف السجل المحدد بنجاح.');
  };

  // Clear all leads
  const handleClearAll = () => {
    localStorage.removeItem('hope_leads');
    setLeads([]);
    setShowClearAllConfirm(false);
    showTemporarySuccess('تم مسح جميع السجلات وقاعدة البيانات بنجاح.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('لا توجد بيانات لتصديرها حالياً.');
      return;
    }

    // CSV headers in Arabic (encoded in UTF-8 BOM so Excel opens Arabic correctly)
    const headers = [
      'الرقم التعريفي',
      'اسم ولي الأمر',
      'رقم الجوال',
      'عمر الطفل',
      'أصيب بالحمى سابقاً؟',
      'المدينة/المنطقة',
      'تاريخ التسجيل'
    ];

    const ageMap = {
      'less-than-6m': 'أقل من 6 أشهر',
      '6-12m': '6-12 شهراً',
      '1-3y': '1-3 سنوات',
      'more-than-3y': 'أكثر من 3 سنوات'
    };

    const feverMap = {
      'yes': 'نعم',
      'no': 'لا',
      'not-sure': 'غير متأكد'
    };

    const rows = leads.map(l => [
      l.id,
      `"${l.parentName.replace(/"/g, '""')}"`,
      `"${l.phoneNumber}"`,
      `"${ageMap[l.childAge] || l.childAge}"`,
      `"${feverMap[l.hadFeverBefore] || l.hadFeverBefore}"`,
      `"${l.city.replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleString('ar-EG')}"`
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Add UTF-8 BOM so Excel opens Arabic characters accurately
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `طلبات_أولياء_الأمور_رعاية_الأمل_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered leads based on search query
  const filteredLeads = leads.filter(l => 
    l.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phoneNumber.includes(searchQuery) ||
    l.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculations
  const totalLeads = leads.length;
  const under6mCount = leads.filter(l => l.childAge === 'less-than-6m').length;
  const experiencedFeverCount = leads.filter(l => l.hadFeverBefore === 'yes').length;
  const notSureFeverCount = leads.filter(l => l.hadFeverBefore === 'not-sure').length;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl text-right mt-10">
        <div className="flex flex-col items-center text-center gap-3 border-b border-white/5 pb-5 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 shadow-md border border-teal-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">تسجيل دخول المشرفين</h2>
          <p className="text-xs text-slate-400 font-medium">
            هذا القسم محمي ومخصص لإدارة وفحص سجلات أولياء الأمور المهتمين بالتواصل.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {authError && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-bold text-rose-300 border border-rose-500/20 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <p>{authError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="passcode" className="block text-sm font-bold text-slate-300">
              أدخل رمز المرور الإداري:
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <Key className="h-4 w-4" />
              </div>
              <input
                type="password"
                id="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="رمز المرور الافتراضي هو admin123"
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-teal-500/50"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-teal-500 to-emerald-500 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/10 border border-white/15 cursor-pointer"
          >
            تأكيد الهوية والدخول
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed font-medium">
          💡 للتجربة السريعة والمراجعة، استخدم الرمز الإداري المطلوب في البرومبت: <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold">admin123</code>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-right space-y-6 animate-fade-in">
      
      {/* Admin Dashboard Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2 sm:text-2xl">
            <Users className="h-6 w-6 text-teal-400" />
            <span>لوحة المتابعة الإدارية وسجلات أولياء الأمور</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            مراجعة بيانات الاتصال المحفوظة محلياً (LocalStorage)، تصدير البيانات إلى Excel، وتصفية المسجلين.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {leads.length === 0 && (
            <button
              onClick={handleInjectMockData}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Database className="h-4 w-4 text-rose-400 animate-pulse" />
              <span>حقن بيانات تجريبية (للمراجعة)</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>تصدير إلى CSV</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Leads */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">إجمالي المسجلين (Leads)</span>
            <span className="text-2xl font-black text-white">{totalLeads}</span>
          </div>
          <div className="rounded-2xl bg-teal-500/10 border border-teal-500/20 p-3 text-teal-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 2: Infants under 6 months */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">أطفال أقل من 6 أشهر (حرج جداً)</span>
            <span className="text-2xl font-black text-rose-400">{under6mCount}</span>
          </div>
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 3: Experienced fever before */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">واجهوا نوبات حرارة سابقاً</span>
            <span className="text-2xl font-black text-amber-400">{experiencedFeverCount}</span>
          </div>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-400">
            <HelpCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 4: High risk ratio */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">نسبة الفئات العمرية الصغيرة</span>
            <span className="text-2xl font-black text-emerald-400">
              {totalLeads > 0 ? Math.round(((under6mCount + leads.filter(l => l.childAge === '6-12m').length) / totalLeads) * 100) : 0}%
            </span>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-400">
            <MapPin className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        
        {/* Table Controls (Search & Clean Database) */}
        <div className="p-4 border-b border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search box */}
          <div className="relative max-w-md w-full">
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم ولي الأمر، رقم الجوال أو المدينة..."
              className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-teal-500/50"
            />
          </div>

          {/* Delete All action */}
          {leads.length > 0 && (
            <div>
              {showClearAllConfirm ? (
                <div className="flex items-center gap-1.5 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20">
                  <span className="text-[10px] font-bold text-red-300">متأكد؟ سيتم مسح الكل</span>
                  <button
                    onClick={handleClearAll}
                    className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-700 cursor-pointer"
                  >
                    نعم، امسح
                  </button>
                  <button
                    onClick={() => setShowClearAllConfirm(false)}
                    className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-1 rounded hover:bg-white/20 cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>تفريغ قاعدة البيانات بالكامل</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Database Table view */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <Info className="h-12 w-12 text-slate-400" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-300">لا توجد سجلات مطابقة حالياً</h3>
                <p className="text-xs text-slate-500">
                  سجل اهتماماً جديداً عبر الواجهة الرئيسية، أو اضغط على زر "حقن بيانات تجريبية" بالرأس.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-white/5 text-slate-300 font-bold uppercase border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">اسم ولي الأمر</th>
                  <th className="px-4 py-3">رقم الهاتف</th>
                  <th className="px-4 py-3">المدينة / الدولة</th>
                  <th className="px-4 py-3">عمر الطفل</th>
                  <th className="px-4 py-3 text-center">أصيب بالحمى؟</th>
                  <th className="px-4 py-3">تاريخ التسجيل</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      {l.parentName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap" dir="ltr">
                      {l.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {l.city}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.childAge === 'less-than-6m' && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">أقل من 6 أشهر</span>}
                      {l.childAge === '6-12m' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold">6 - 12 شهراً</span>}
                      {l.childAge === '1-3y' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">1 - 3 سنوات</span>}
                      {l.childAge === 'more-than-3y' && <span className="bg-white/10 text-slate-300 border border-white/5 px-2.5 py-0.5 rounded-full font-bold">أكثر من 3 سنوات</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {l.hadFeverBefore === 'yes' && <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">نعم</span>}
                      {l.hadFeverBefore === 'no' && <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">لا</span>}
                      {l.hadFeverBefore === 'not-sure' && <span className="text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">غير متأكد</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {deleteConfirmId === l.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteIndividual(l.id)}
                            className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-700 cursor-pointer"
                          >
                            حذف
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-1 rounded hover:bg-white/20 cursor-pointer"
                          >
                            تراجع
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(l.id)}
                          className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          title="حذف هذا الطلب"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
