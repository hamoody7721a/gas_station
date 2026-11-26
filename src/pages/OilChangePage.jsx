import React, { useState } from 'react';
import { Wrench, Calendar, PhoneCall } from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function OilChangePage() {
  const { settings, availableSlots, createBooking } = useStation();

  const [form, setForm] = useState({
    serviceType: 'oil_change',
    timeSlot: availableSlots[0] || '',
    plate: '',
    customerName: '',
    phone: '',
    carModel: '',
    oilType: '',
    notes: '',
    requestFreeWash: false,
  });
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = createBooking({ ...form, serviceType: 'oil_change' }, 'customer');
    setMessage(res.message);
    if (res.ok) {
      setForm((prev) => ({
        ...prev,
        timeSlot: availableSlots.find((s) => s !== prev.timeSlot) || '',
        plate: '',
        customerName: '',
        phone: '',
        carModel: '',
        oilType: '',
        notes: '',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* تعريف غيار الزيت */}
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              <Wrench className="h-3.5 w-3.5" />
              مدة الموعد {settings.oilDurationMin} دقيقة
            </span>
            <h2 className="text-2xl font-black">غيار الزيت</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              جدولة مخصصة لغيار الزيت مع تحديد نوع السيارة ونوع الزيت مسبقاً لتجهيز القطع قبل وصولك، ويُحدد المبلغ الفعلي عند إتمام الخدمة.
            </p>
          </div>
          <a
            href={`https://wa.me/963900000000?text=${encodeURIComponent(
              'مرحباً محطة حمدان، أرغب بحجز موعد لغيار الزيت.'
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
          >
            <PhoneCall className="h-4 w-4" />
            تأكيد عبر واتساب
          </a>
        </div>
      </section>

      {/* نموذج حجز غيار الزيت */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-black flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          حجز موعد غيار زيت
        </h3>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <label className="block font-bold mb-1">الوقت المتاح</label>
            <select
              value={form.timeSlot}
              onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold"
            >
              {availableSlots.length === 0 ? (
                <option value="">لا توجد أوقات شاغرة حالياً</option>
              ) : (
                availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} (متاح)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">نمرة السيارة *</label>
            <input
              type="text"
              required
              value={form.plate}
              onChange={(e) => setForm((prev) => ({ ...prev, plate: e.target.value }))}
              placeholder="مثال: حمص-60144"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">الاسم الكامل *</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
              placeholder="الاسم الثلاثي"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">رقم الموبايل *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="09xxxxxxxx"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">نوع السيارة وسنة الصنع</label>
            <input
              type="text"
              value={form.carModel}
              onChange={(e) => setForm((prev) => ({ ...prev, carModel: e.target.value }))}
              placeholder="مثال: كيا سيراتو 2019"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">نوع الزيت (اختياري)</label>
            <input
              type="text"
              value={form.oilType}
              onChange={(e) => setForm((prev) => ({ ...prev, oilType: e.target.value }))}
              placeholder="مثال: 5W-30 تخليقي كامل"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block font-bold mb-1">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="تبديل فلتر الزيت أو أي ملاحظة..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={availableSlots.length === 0}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              تأكيد حجز غيار الزيت
            </button>
          </div>
        </form>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
            {message}
          </div>
        )}
      </section>
    </div>
  );
}