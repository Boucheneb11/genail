/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, Users, Calendar, HelpCircle, MapPin, Trash2, 
  Download, LogOut, Search, Info, ShieldAlert, CheckCircle, Database,
  FileSpreadsheet, Sparkles, RefreshCw, ExternalLink, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Lead } from '../types';
import { User } from 'firebase/auth';
import { 
  initAuth, googleSignIn, logout, createGoogleSheet, 
  appendLeadRows, checkSpreadsheetExists, fetchSpreadsheetRows
} from '../lib/googleAuth';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Google Sheets integration states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingFromSheets, setIsFetchingFromSheets] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [sheetsError, setSheetsError] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  // Load leads from LocalStorage on mount/auth
  useEffect(() => {
    if (isAuthenticated) {
      loadLeadsFromStorage();
    }
  }, [isAuthenticated]);

  // Load Google Auth state and spreadsheet state on auth
  useEffect(() => {
    if (isAuthenticated) {
      initAuth(
        (user, token) => {
          setGoogleUser(user);
          setGoogleToken(token);
        },
        () => {
          setGoogleUser(null);
          setGoogleToken(null);
        }
      );
      
      const savedSheetId = localStorage.getItem('hope_spreadsheet_id') || '';
      setSpreadsheetId(savedSheetId);

      const savedAutoSync = localStorage.getItem('hope_auto_sync') === 'true';
      setAutoSyncEnabled(savedAutoSync);
    }
  }, [isAuthenticated]);

  const handleFetchFromSheets = async (token: string, sheetId: string) => {
    if (!token || !sheetId) return;
    setIsFetchingFromSheets(true);
    setSheetsError('');
    try {
      const remoteLeads = await fetchSpreadsheetRows(token, sheetId);
      if (remoteLeads && remoteLeads.length > 0) {
        setLeads(prev => {
          // Merge remote leads with any existing ones to avoid duplicates
          const merged = [...remoteLeads];
          const remotePhones = new Set(remoteLeads.map(l => l.phoneNumber.trim()));
          
          prev.forEach(localLead => {
            if (!remotePhones.has(localLead.phoneNumber.trim())) {
              merged.push(localLead);
            }
          });
          
          // Sort by creation date descending
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Save back to localStorage
          localStorage.setItem('hope_leads', JSON.stringify(merged));
          return merged;
        });
        showTemporarySuccess('تم تحديث البيانات وجلب أحدث السجلات والمدخلات تلقائياً من جداول بيانات Google!');
      } else {
        showTemporarySuccess('تم الاتصال بـ Google Sheets بنجاح، ولم يتم العثور على مدخلات جديدة حالياً.');
      }
    } catch (err: any) {
      console.error('Failed to auto-fetch from Sheets:', err);
      setSheetsError('فشل تحديث السجلات تلقائياً من جداول بيانات Google. يرجى مراجعة الصلاحيات أو الملف المرتبط.');
    } finally {
      setIsFetchingFromSheets(false);
    }
  };

  // Trigger auto-fetch once Google Auth is loaded and Spreadsheet is linked
  useEffect(() => {
    if (isAuthenticated && googleToken && spreadsheetId) {
      handleFetchFromSheets(googleToken, spreadsheetId);
    }
  }, [isAuthenticated, googleToken, spreadsheetId]);

  const handleGoogleLogin = async () => {
    setSheetsError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        showTemporarySuccess('تم ربط حساب Google وتنشيط الاتصال بجداول البيانات بنجاح!');
      }
    } catch (err: any) {
      console.error(err);
      setSheetsError('فشل الاتصال بحساب Google. يرجى المحاولة لاحقاً.');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      showTemporarySuccess('تم تسجيل الخروج بنجاح وإلغاء صلاحيات الجلسة المؤقتة.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!googleToken) return;
    setIsCreatingSheet(true);
    setSheetsError('');
    try {
      const title = `مسجلي منصة رعاية الأمل بالجزائر - ${new Date().toLocaleDateString('ar-DZ')}`;
      const sheetId = await createGoogleSheet(googleToken, title);
      setSpreadsheetId(sheetId);
      localStorage.setItem('hope_spreadsheet_id', sheetId);
      showTemporarySuccess('تم إنشاء جدول بيانات Google Sheets جديد وجاهز للمزامنة!');
    } catch (err: any) {
      console.error(err);
      setSheetsError('فشل إنشاء جدول البيانات. يرجى التأكد من الصلاحيات.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncLeadsToSheet = async () => {
    if (!googleToken || !spreadsheetId) return;
    if (leads.length === 0) {
      setSheetsError('لا توجد سجلات لتصديرها حالياً.');
      return;
    }
    setIsSyncing(true);
    setSheetsError('');
    setShowSyncConfirm(false);

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

    try {
      // Check if current sheet is valid
      const exists = await checkSpreadsheetExists(googleToken, spreadsheetId);
      if (!exists) {
        throw new Error('جدول البيانات غير متوفر أو ليس لديك صلاحية الوصول إليه.');
      }

      const rowsToAppend = leads.map(l => [
        l.parentName,
        l.phoneNumber,
        ageMap[l.childAge] || l.childAge,
        feverMap[l.hadFeverBefore] || l.hadFeverBefore,
        l.city,
        new Date(l.createdAt).toLocaleString('ar-DZ')
      ]);

      await appendLeadRows(googleToken, spreadsheetId, rowsToAppend);
      showTemporarySuccess(`تمت المزامنة وتصدير ${leads.length} سجل بنجاح إلى جدول Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      setSheetsError(err.message || 'حدث خطأ أثناء مزامنة البيانات. يرجى مراجعة الصلاحيات أو الملف.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    const newVal = !autoSyncEnabled;
    setAutoSyncEnabled(newVal);
    localStorage.setItem('hope_auto_sync', newVal ? 'true' : 'false');
    showTemporarySuccess(
      newVal 
        ? 'تم تفعيل المزامنة التلقائية! سيتم إرسال أي تسجيل جديد مباشرة إلى Google Sheets.' 
        : 'تم إيقاف المزامنة التلقائية.'
    );
  };

  const handleLinkExistingSheet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const inputId = data.get('sheetId')?.toString() || '';
    const trimmed = inputId.trim();
    if (trimmed) {
      setSpreadsheetId(trimmed);
      localStorage.setItem('hope_spreadsheet_id', trimmed);
      showTemporarySuccess('تم ربط معرف جدول البيانات الحالي بنجاح.');
    }
  };

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
                placeholder="أدخل رمز المرور الإداري..."
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

      {/* Auto-fetching status / Loading spinner */}
      {isFetchingFromSheets && (
        <div className="rounded-2xl bg-teal-500/10 p-4 border border-teal-500/20 text-xs font-bold text-teal-300 flex items-center justify-between shadow-lg shadow-teal-500/5 animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
            <p className="text-right">جاري مزامنة وجلب أحدث السجلات والطلبات تلقائياً من جداول بيانات Google...</p>
          </div>
          <span className="text-[10px] text-teal-400 bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-500/20 font-black shrink-0">
            تحديث مباشر سحابي
          </span>
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

      {/* Google Sheets Integration Panel */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileSpreadsheet className="h-5.5 w-5.5" />
            </div>
            <div className="text-right">
              <h2 className="text-base font-black text-white">مزامنة البيانات السحابية (Google Sheets)</h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                اربط لوحة التحكم بجدول بيانات Google لتصدير وتلقي التسجيلات الجديدة تلقائياً وبأمان.
              </p>
            </div>
          </div>

          {!googleUser ? (
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2 text-xs font-black hover:bg-slate-100 transition-colors cursor-pointer shadow-lg shadow-white/5"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>ربط حساب Google</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[11px] font-black text-emerald-400">✓ حساب Google متصل</span>
                <span className="block text-[10px] text-slate-400 font-semibold">{googleUser.email}</span>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="text-[10px] font-bold text-rose-400 hover:underline border border-rose-500/20 bg-rose-500/5 px-2 py-1 rounded-lg"
              >
                فصل الاتصال
              </button>
            </div>
          )}
        </div>

        {sheetsError && (
          <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-bold text-rose-300 border border-rose-500/20 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p>{sheetsError}</p>
          </div>
        )}

        {googleUser && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sheet Link / Set up Card */}
            <div className="rounded-2xl bg-black/20 border border-white/5 p-4 space-y-4 text-right">
              <h3 className="text-xs font-black text-slate-300">أولاً: إعداد وتعيين جدول البيانات المستهدف</h3>
              
              {spreadsheetId ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-3 flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-teal-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-right flex-1 min-w-0">
                      <span className="block text-xs font-bold text-white truncate">معرف الملف المرتبط:</span>
                      <span className="block text-[10px] text-slate-400 font-mono truncate">{spreadsheetId}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500/15 border border-teal-500/20 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/25 transition-all"
                    >
                      <span>عرض وتفقد جدول البيانات</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    
                    <button
                      onClick={() => {
                        setSpreadsheetId('');
                        localStorage.removeItem('hope_spreadsheet_id');
                        showTemporarySuccess('تم إلغاء ربط جدول البيانات.');
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="إلغاء الربط"
                    >
                      إلغاء الربط
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <button
                      onClick={handleCreateNewSpreadsheet}
                      disabled={isCreatingSheet}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-teal-500 to-emerald-500 py-2.5 text-xs font-black text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-teal-500/10"
                    >
                      {isCreatingSheet ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>جاري إنشاء وتنسيق الملف...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>إنشاء جدول بيانات Google جديد كلياً وجاهز</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 font-semibold text-center leading-relaxed">
                      يقوم هذا الخيار بإنشاء ملف Google Sheet جديد في حسابك وتنسيق الأعمدة لسلامة طفلك.
                    </p>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-black">أو</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <form onSubmit={handleLinkExistingSheet} className="space-y-2 text-right">
                    <label className="block text-[11px] font-bold text-slate-400">
                      ربط باستخدام معرف جدول بيانات موجود (Spreadsheet ID):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="sheetId"
                        required
                        placeholder="أدخل المعرف الطويل من عنوان الرابط..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500/50"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
                      >
                        ربط الملف
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Sync Control Card */}
            <div className="rounded-2xl bg-black/20 border border-white/5 p-4 flex flex-col justify-between space-y-4 text-right">
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-300">ثانياً: مزامنة وتصدير السجلات الحالية</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  يمكنك مزامنة وتصدير كافة سجلات أولياء الأمور المتوفرة حالياً على هذا المتصفح ({leads.length} سجل) إلى الجدول المتصل بضغطة زر واحدة.
                </p>

                {/* Auto Sync Toggle option */}
                {spreadsheetId && (
                  <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center justify-between">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-white">المزامنة التلقائية اللحظية:</span>
                      <span className="block text-[10px] text-slate-500 font-semibold">تصدير التسجيلات الجديدة مباشرة فور ملئها بالواجهة.</span>
                    </div>
                    <button
                      onClick={toggleAutoSync}
                      className="text-teal-400 hover:text-teal-300 transition-all cursor-pointer"
                    >
                      {autoSyncEnabled ? (
                        <ToggleRight className="h-8 w-8 text-teal-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-slate-500" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {spreadsheetId && (
                  <button
                    type="button"
                    onClick={() => handleFetchFromSheets(googleToken!, spreadsheetId)}
                    disabled={isFetchingFromSheets || !googleToken}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 px-4 py-2.5 text-xs font-black text-teal-200 hover:bg-teal-500/30 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isFetchingFromSheets ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-teal-300" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-teal-300 animate-pulse" />
                    )}
                    <span>جلب وتحديث البيانات السحابية يدوياً</span>
                  </button>
                )}

                {showSyncConfirm ? (
                  <div className="bg-amber-500/15 border border-amber-500/20 rounded-xl p-3 space-y-2.5">
                    <p className="text-[10px] font-black text-amber-300 leading-normal">
                      💡 هل تود تأكيد تصدير ومزامنة كافة السجلات الحالية إلى جدول البيانات؟ سيتم إضافة صفوف جديدة.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncLeadsToSheet}
                        disabled={isSyncing}
                        className="flex-1 py-1.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        {isSyncing ? 'جاري التصدير...' : 'تأكيد التصدير لمستند Google'}
                      </button>
                      <button
                        onClick={() => setShowSyncConfirm(false)}
                        className="bg-white/10 text-slate-300 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!spreadsheetId) {
                        setSheetsError('يرجى إنشاء أو ربط جدول بيانات أولاً قبل المزامنة.');
                        return;
                      }
                      setShowSyncConfirm(true);
                    }}
                    disabled={leads.length === 0 || !spreadsheetId}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 px-4 py-2.5 text-xs font-black text-teal-400 hover:bg-teal-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-teal-400" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                    )}
                    <span>تصدير السجلات الحالية ومزامنتها يدوياً</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table section */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        
        {/* Table Controls (Search & Clean Database) */}
        <div className="p-4 border-b border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl w-full">
            {/* Search box */}
            <div className="relative flex-1">
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

            {/* Manual Refresh from Google Sheets button with Loading Spinner */}
            <button
              onClick={() => {
                if (googleToken && spreadsheetId) {
                  handleFetchFromSheets(googleToken, spreadsheetId);
                } else {
                  setSheetsError('الرجاء ربط حساب Google وتنسيق جدول البيانات أولاً للتمكن من تحديث وجلب البيانات سحابياً.');
                }
              }}
              disabled={isFetchingFromSheets}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-black transition-all cursor-pointer ${
                googleToken && spreadsheetId
                  ? 'border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="تحديث وجلب السجلات من Google Sheets"
            >
              {isFetchingFromSheets ? (
                <RefreshCw className="h-4 w-4 text-teal-400 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 text-teal-400" />
              )}
              <span>تحديث سحابي</span>
            </button>
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
