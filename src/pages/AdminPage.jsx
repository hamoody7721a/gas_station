import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Sliders,
  Users,
  History,
  Clock,
  AlertTriangle,
  Award,
  Settings,
  ShieldCheck,
  KeyRound,
  Ban,
  Unlock,
  FileText,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function AdminPage() {
  const {
    settings,
    setSettings,
    staffList,
    customers,
    fuelLogs,
    bookings,
    auditLogs,
    dateFilter,
    setDateFilter,
    addStaff,
    toggleStaffActive,
    setStaffPasswordByAdmin,
    adjustCustomerBalance,
  } = useStation();

  const [adminTab, setAdminTab] = useState('dashboard');
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    role: 'pump_attendant',
    username: '',
    password: '123',
    shiftNote: '',
  });
  const [editingPassId, setEditingPassId] = useState(null);
  const [newPassValue, setNewPassValue] = useState('');
  const [adminNotice, setAdminNotice] = useState('');

  const [adminAdjustPlate, setAdminAdjustPlate] = useState('دمشق-44812');
  const [adminAdjustLiters, setAdminAdjustLiters] = useState('10');
  const [adminAdjustReason, setAdminAdjustReason] = useState('');

  const filteredFuelLogs = useMemo(() => {
    if (!dateFilter) return fuelLogs;
    return fuelLogs.filter((f) => f.date === dateFilter);
  }, [fuelLogs, dateFilter]);

  const dashboardStats = useMemo(() => {
    const benzineLiters = filteredFuelLogs
      .filter((f) => f.fuelType === 'benzine')
      .reduce((sum, f) => sum + f.liters, 0);
    const mazoutLiters = filteredFuelLogs
      .filter((f) => f.fuelType === 'mazout')
      .reduce((sum, f) => sum + f.liters, 0);
    const benzineEstSales = filteredFuelLogs
      .filter((f) => f.fuelType === 'benzine')
      .reduce((sum, f) => sum + f.estimatedAmount, 0);
    const mazoutEstSales = filteredFuelLogs
      .filter((f) => f.fuelType === 'mazout')
      .reduce((sum, f) => sum + f.estimatedAmount, 0);

    const completedBookings = bookings.filter((b) => b.status === 'completed');
    const carWashCount = completedBookings.filter((b) => b.serviceType === 'car_wash').length;
    const carpetWashCount = completedBookings.filter((b) => b.serviceType === 'carpet_wash').length;
    const oilChangeCount = completedBookings.filter((b) => b.serviceType === 'oil_change').length;

    const freeWashesUsedCount = completedBookings.filter((b) => b.isFreeWash).length;
    const freeWashesGrantedCount = Object.values(customers).filter(
      (c) => c.litersBalance >= settings.thresholdLiters
    ).length;

    const washRevenue = completedBookings
      .filter((b) => b.serviceType === 'car_wash' || b.serviceType === 'carpet_wash')
      .reduce((sum, b) => sum + (b.isFreeWash ? 0 : Number(b.actualAmount || 0)), 0);

    const oilRevenue = completedBookings
      .filter((b) => b.serviceType === 'oil_change')
      .reduce((sum, b) => sum + Number(b.actualAmount || 0), 0);

    const rewardCostSeparate = freeWashesUsedCount * settings.prices.freeWashCostEstimate;

    const byAttendant = {};
    filteredFuelLogs.forEach((f) => {
      byAttendant[f.attendantName] = (byAttendant[f.attendantName] || 0) + f.liters;
    });

    const largeLogs = filteredFuelLogs.filter((f) => f.flaggedLarge);
    const eligibleCars = Object.values(customers).filter(
      (c) => c.litersBalance >= settings.thresholdLiters
    );

    return {
      benzineLiters,
      mazoutLiters,
      totalLiters: benzineLiters + mazoutLiters,
      totalEstFuelSales: benzineEstSales + mazoutEstSales,
      refuelCount: filteredFuelLogs.length,
      avgRefuel: filteredFuelLogs.length
        ? ((benzineLiters + mazoutLiters) / filteredFuelLogs.length).toFixed(1)
        : '0.0',
      carWashCount,
      carpetWashCount,
      oilChangeCount,
      freeWashesUsedCount,
      freeWashesGrantedCount,
      washRevenue,
      oilRevenue,
      rewardCostSeparate,
      byAttendant,
      largeLogs,
      eligibleCars,
      attendedCount: bookings.filter((b) => b.status === 'completed').length,
      cancelledCount: bookings.filter((b) => b.status === 'cancelled').length,
      noShowCount: bookings.filter((b) => b.status === 'no_show').length,
      upcomingCount: bookings.filter((b) => b.status === 'upcoming').length,
    };
  }, [filteredFuelLogs, bookings, customers, settings]);

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.username.trim()) return;
    addStaff(newStaffForm);
    setAdminNotice(`تم إنشاء حساب ${newStaffForm.name} بنجاح.`);
    setNewStaffForm({
      name: '',
      role: 'pump_attendant',
      username: '',
      password: '123',
      shiftNote: '',
    });
  };

  const handleSaveNewPassword = (staffId, staffName) => {
    if (!newPassValue.trim()) return;
    setStaffPasswordByAdmin(staffId, newPassValue);
    setAdminNotice(`تم تحديث كلمة السر لحساب ${staffName}.`);
    setEditingPassId(null);
    setNewPassValue('');
  };

  const handleBalanceAdjustSubmit = (e) => {
    e.preventDefault();
    const delta = parseInt(adminAdjustLiters, 10);
    if (!adminAdjustPlate || isNaN(delta)) return;
    adjustCustomerBalance(adminAdjustPlate, delta, adminAdjustReason);
    setAdminNotice(`تم تعديل رصيد السيارة ${adminAdjustPlate} وتوثيقه.`);
    setAdminAdjustReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          onClick={() => setAdminTab('dashboard')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
            adminTab === 'dashboard'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          حصيلة اليوم والتقارير
        </button>
        <button
          onClick={() => setAdminTab('offers_settings')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
            adminTab === 'offers_settings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sliders className="h-4 w-4" />
          العروض والأسعار والإعدادات
        </button>
        <button
          onClick={() => setAdminTab('staff')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
            adminTab === 'staff'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          حسابات الموظفين والأرصدة
        </button>
        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
            adminTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          سجل التعديلات ({auditLogs.length})
        </button>
      </div>

      {adminNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
          {adminNotice}
        </div>
      )}

      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-extrabold">فلتر التاريخ:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                عرض كل الأيام
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>
                آخر تحديث لأسعار الوقود: <strong>{settings.lastPriceUpdateDate}</strong> (تنبيه التأخر بعد {settings.priceStaleWarningDays} يوم)
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">إجمالي اللترات المسجلة</div>
              <div className="mt-1 text-2xl font-black text-slate-900">
                {dashboardStats.totalLiters} لتر
              </div>
              <div className="mt-2 text-xs text-slate-600">
                بنزين: {dashboardStats.benzineLiters} لتر • مازوت: {dashboardStats.mazoutLiters} لتر
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">مبيعات الوقود التقديرية</div>
              <div className="mt-1 text-2xl font-black text-amber-700">
                {dashboardStats.totalEstFuelSales.toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                تقدير (اللترات × سعر وقت العملية) وليس دخلاً فعلياً
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">دخل المغسلة وغيار الزيت</div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {(dashboardStats.washRevenue + dashboardStats.oilRevenue).toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                مغسلة: {dashboardStats.washRevenue} • زيت: {dashboardStats.oilRevenue}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">
                تكلفة الغسائل المجانية (خانة منفصلة)
              </div>
              <div className="mt-1 text-2xl font-black text-rose-700">
                {dashboardStats.rewardCostSeparate.toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                مستخدمة: {dashboardStats.freeWashesUsedCount} • مستحقة: {dashboardStats.freeWashesGrantedCount}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-black">الخدمات والحجوزات</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>غسيل سيارات / سجاد:</span>
                  <strong>
                    {dashboardStats.carWashCount} / {dashboardStats.carpetWashCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>عمليات غيار الزيت:</span>
                  <strong>{dashboardStats.oilChangeCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>عدد التعبئات / متوسط التعبئة:</span>
                  <strong>
                    {dashboardStats.refuelCount} / {dashboardStats.avgRefuel} لتر
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span>الحجوزات (حضر / قادم / لم يحضر / ملغى):</span>
                  <strong>
                    {dashboardStats.attendedCount} / {dashboardStats.upcomingCount} /{' '}
                    {dashboardStats.noShowCount} / {dashboardStats.cancelledCount}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-black">مجموع اللترات حسب الموظف</h3>
              <div className="space-y-2 text-xs">
                {Object.keys(dashboardStats.byAttendant).length === 0 ? (
                  <p className="text-slate-500">لا توجد تعبئات ضمن الفلتر الحالي.</p>
                ) : (
                  Object.entries(dashboardStats.byAttendant).map(([name, liters]) => (
                    <div key={name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-bold">{name}</span>
                      <span className="font-black text-slate-900">{liters} لتر</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                للمراجعة والمراقبة
              </h3>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <strong>عمليات فوق حد الكمية:</strong> {dashboardStats.largeLogs.length} عملية
                </div>
                <div className="rounded-lg bg-emerald-50 p-2.5">
                  <strong>سيارات وصلت للعتبة ({settings.thresholdLiters} لتر):</strong>{' '}
                  {dashboardStats.eligibleCars.length
                    ? dashboardStats.eligibleCars.map((c) => c.plate).join('، ')
                    : 'لا يوجد'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'offers_settings' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              إعدادات العروض والنقاط
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-bold mb-1">عتبة الجائزة (لترات)</label>
                <input
                  type="number"
                  value={settings.thresholdLiters}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      thresholdLiters: Math.max(1, Number(e.target.value) || 100),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الجائزة</label>
                <input
                  type="text"
                  value={settings.rewardName}
                  onChange={(e) => setSettings((s) => ({ ...s, rewardName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">معامل البنزين</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.fuelFactors.benzine}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      fuelFactors: { ...s.fuelFactors, benzine: Number(e.target.value) || 1 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">معامل المازوت</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.fuelFactors.mazout}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      fuelFactors: { ...s.fuelFactors, mazout: Number(e.target.value) || 1 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">حد أقصى غسيل مجاني / شهر للسيارة</label>
                <input
                  type="number"
                  value={settings.maxFreeWashPerCarPerMonth}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      maxFreeWashPerCarPerMonth: Math.max(0, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تنبيه كمية بنزين كبيرة (لتر)</label>
                <input
                  type="number"
                  value={settings.largeQtyAlertLiters.benzine}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      largeQtyAlertLiters: {
                        ...s.largeQtyAlertLiters,
                        benzine: Number(e.target.value) || 80,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">فترات الغسيلة المجانية المسموحة</label>
                <input
                  type="text"
                  value={settings.freeWashAllowedHours}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, freeWashAllowedHours: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-700" />
              الأسعار والتكاليف والمدد
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-bold mb-1">سعر لتر البنزين الحالي</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.prices.benzinePerLiter}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      lastPriceUpdateDate: dateFilter || '2026-11-26',
                      prices: { ...s.prices, benzinePerLiter: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">سعر لتر المازوت الحالي</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.prices.mazoutPerLiter}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      lastPriceUpdateDate: dateFilter || '2026-11-26',
                      prices: { ...s.prices, mazoutPerLiter: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">سعر غسيل السيارة</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.prices.carWashPrice}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      prices: { ...s.prices, carWashPrice: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">سعر غسيل السجاد</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.prices.carpetWashPrice}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      prices: { ...s.prices, carpetWashPrice: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تكلفة الغسيلة المجانية (للتقرير المنفصل)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.prices.freeWashCostEstimate}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      prices: { ...s.prices, freeWashCostEstimate: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">مدة موعد الغسيل / الزيت (دقيقة)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settings.washDurationMin}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, washDurationMin: Number(e.target.value) || 60 }))
                    }
                    className="w-1/2 rounded-xl border border-slate-300 px-2 py-2 font-bold"
                  />
                  <input
                    type="number"
                    value={settings.oilDurationMin}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, oilDurationMin: Number(e.target.value) || 45 }))
                    }
                    className="w-1/2 rounded-xl border border-slate-300 px-2 py-2 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'staff' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-800" />
              إدارة حسابات الموظفين وكلمات المرور
            </h3>

            <form onSubmit={handleAddStaffSubmit} className="grid gap-2.5 sm:grid-cols-5 text-xs">
              <input
                type="text"
                required
                value={newStaffForm.name}
                onChange={(e) => setNewStaffForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="اسم الموظف"
                className="rounded-xl border border-slate-300 px-3 py-2 font-semibold"
              />
              <input
                type="text"
                required
                value={newStaffForm.username}
                onChange={(e) => setNewStaffForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="اسم المستخدم"
                className="rounded-xl border border-slate-300 px-3 py-2 font-semibold"
              />
              <input
                type="text"
                required
                value={newStaffForm.password}
                onChange={(e) => setNewStaffForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="كلمة السر"
                className="rounded-xl border border-slate-300 px-3 py-2 font-semibold"
              />
              <select
                value={newStaffForm.role}
                onChange={(e) => setNewStaffForm((p) => ({ ...p, role: e.target.value }))}
                className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
              >
                <option value="pump_attendant">شب التاب</option>
                <option value="wash_oil_manager">مسؤول المغسلة والزيت</option>
                <option value="admin">أدمن</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-3 py-2 font-extrabold text-white hover:bg-slate-800"
              >
                إنشاء حساب
              </button>
            </form>

            <div className="divide-y divide-slate-100 text-xs">
              {staffList.map((st) => (
                <div key={st.id} className="py-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold">
                        {st.name}{' '}
                        <span className="text-slate-500 font-normal">({st.username})</span>
                      </div>
                      <div className="text-slate-500">{st.shiftNote}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPassId(editingPassId === st.id ? null : st.id);
                          setNewPassValue('');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        تعيين كلمة سر
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStaffActive(st.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold ${
                          st.active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {st.active ? (
                          <>
                            <Ban className="h-3.5 w-3.5" />
                            إيقاف الحساب
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3.5 w-3.5" />
                            تفعيل الحساب
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {editingPassId === st.id && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                      <input
                        type="text"
                        value={newPassValue}
                        onChange={(e) => setNewPassValue(e.target.value)}
                        placeholder="أدخل كلمة السر الجديدة"
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNewPassword(st.id, st.name)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        حفظ كلمة السر
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black">تعديل رصيد سيارة (مع توثيق إلزامي)</h3>
            <form onSubmit={handleBalanceAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">السيارة</label>
                <select
                  value={adminAdjustPlate}
                  onChange={(e) => setAdminAdjustPlate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                >
                  {Object.values(customers).map((c) => (
                    <option key={c.plate} value={c.plate}>
                      {c.plate} (الرصيد الحالي: {c.litersBalance} لتر)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">الفرق باللترات (+ أو -)</label>
                <input
                  type="number"
                  value={adminAdjustLiters}
                  onChange={(e) => setAdminAdjustLiters(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">سبب التعديل</label>
                <input
                  type="text"
                  value={adminAdjustReason}
                  onChange={(e) => setAdminAdjustReason(e.target.value)}
                  placeholder="مثال: تصحيح إدخال سابق"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-4 py-2.5 font-extrabold text-slate-950 hover:bg-amber-400"
              >
                حفظ التعديل وتسجيله في السجل
              </button>
            </form>
          </div>
        </div>
      )}

      {adminTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-800" />
            سجل التعديلات والعمليات الرقابية (مين غيّر شو ومتى)
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-black text-slate-900">{item.action}</span> —{' '}
                  <span className="text-slate-700">{item.details}</span>
                </div>
                <div className="text-slate-500 whitespace-nowrap">
                  بواسطة: <strong className="text-slate-700">{item.actor}</strong> • {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}