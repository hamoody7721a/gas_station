import React, { useMemo, useState } from 'react';
import {
  Award,
  Fuel,
  Droplets,
  Wrench,
  Search,
  QrCode,
  Calendar,
  PhoneCall,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function CustomerPage() {
  const {
    settings,
    customers,
    availableSlots,
    canClaimFreeWash,
    createBooking,
    activeQrPreview,
  } = useStation();

  const [lookupPlate, setLookupPlate] = useState('دمشق-90211');
  const [last3Input, setLast3Input] = useState('');
  const [customerNotice, setCustomerNotice] = useState('');

  const [bookingForm, setBookingForm] = useState({
    serviceType: 'car_wash',
    timeSlot: availableSlots[0] || '',
    plate: '',
    customerName: '',
    phone: '',
    carModel: '',
    oilType: '',
    notes: '',
    requestFreeWash: false,
  });
  const [bookingMessage, setBookingMessage] = useState('');

  const inspectedCustomer = useMemo(() => {
    const key = lookupPlate.trim();
    if (!key) return null;
    return customers[key] || null;
  }, [lookupPlate, customers]);

  const handleClaimFromBalancePage = () => {
    setCustomerNotice('');
    if (!inspectedCustomer) {
      setCustomerNotice('لم يتم العثور على نمرة السيارة.');
      return;
    }
    if (!canClaimFreeWash(inspectedCustomer)) {
      setCustomerNotice('السيارة غير مؤهلة حالياً للغسيلة المجانية (تحقق من النقاط أو الحد الشهري).');
      return;
    }
    if (
      inspectedCustomer.phoneLast3 &&
      inspectedCustomer.phoneLast3 !== '000' &&
      last3Input.trim() !== inspectedCustomer.phoneLast3
    ) {
      setCustomerNotice('يرجى إدخال آخر 3 أرقام من رقم الموبايل المسجل للتحقق.');
      return;
    }

    setBookingForm((prev) => ({
      ...prev,
      serviceType: 'car_wash',
      plate: inspectedCustomer.plate,
      requestFreeWash: true,
    }));
    setCustomerNotice('تم التحقق بنجاح! اختر الوقت المناسب أدناه لإتمام حجز الغسيلة المجانية.');
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const res = createBooking(bookingForm, 'customer');
    setBookingMessage(res.message);
    if (res.ok) {
      setBookingForm((prev) => ({
        ...prev,
        timeSlot: availableSlots.find((s) => s !== prev.timeSlot) || '',
        plate: '',
        customerName: '',
        phone: '',
        carModel: '',
        oilType: '',
        notes: '',
        requestFreeWash: false,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
              <Award className="h-3.5 w-3.5" />
              كل {settings.thresholdLiters} لتر = {settings.rewardName}
            </span>
            <h2 className="text-2xl font-black sm:text-3xl">
              أهلاً بك في {settings.stationName}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              خدمة وقود سريعة، غسيل سيارات وسجاد باحترافية، وغيار زيت دقيق. تابع رصيد سيارتك بنمرة اللوحة فقط واحجز موعدك بسهولة دون الحاجة لإنشاء حساب.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#balance-section"
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-400"
            >
              فحص الرصيد والنقاط
            </a>
            <a
              href="#booking-section"
              className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
            >
              حجز موعد
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Fuel className="h-5 w-5" />
              الكازية والنقاط
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              بنزين ({settings.prices.benzinePerLiter}/لتر) ومازوت ({settings.prices.mazoutPerLiter}/لتر). كل لتر يضاف تلقائياً لرصيد سيارتك (صلاحية {settings.pointsExpiryDays} يوماً).
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Droplets className="h-5 w-5" />
              المغسلة (سيارات وسجاد)
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              غسيل سيارة ({settings.prices.carWashPrice}) وغسيل سجاد ({settings.prices.carpetWashPrice}) بمدة موعد {settings.washDurationMin} دقيقة، بالإضافة للغسائل المجانية في أوقات الهدوء.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Wrench className="h-5 w-5" />
              غيار الزيت
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              جدولة مخصصة بمدة {settings.oilDurationMin} دقيقة مع تحديد نوع السيارة والزيت مسبقاً لتجهيز القطع قبل وصولك.
            </p>
          </div>
        </div>
      </section>

      <section id="balance-section" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-600" />
              صفحة رصيد السيارة (بدون حساب)
            </h3>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              خصوصية كاملة
            </span>
          </div>

          <p className="text-xs text-slate-500">
            أدخل نمرة السيارة لعرض الرصيد الحالي والعرض النشط دون عرض أي بيانات شخصية كاملة. جرب مثلاً: <code className="rounded bg-slate-100 px-1.5 py-0.5">دمشق-90211</code> أو <code className="rounded bg-slate-100 px-1.5 py-0.5">دمشق-44812</code>.
          </p>

          <input
            type="text"
            value={lookupPlate}
            onChange={(e) => {
              setLookupPlate(e.target.value);
              setCustomerNotice('');
            }}
            placeholder="مثال: دمشق-90211"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold focus:border-amber-500 focus:outline-none"
          />

          {inspectedCustomer ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">نمرة السيارة</div>
                  <div className="text-base font-black">{inspectedCustomer.plate}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500">الموبايل (مخفي جزئياً)</div>
                  <div className="text-sm font-bold text-slate-700" dir="ltr">
                    {inspectedCustomer.phoneMasked}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>الرصيد: {inspectedCustomer.litersBalance} لتر</span>
                  <span>العتبة: {settings.thresholdLiters} لتر</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (inspectedCustomer.litersBalance / settings.thresholdLiters) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>آخر تعبئة: {inspectedCustomer.lastRefuelDate}</span>
                <span>
                  الغسائل المجانية هذا الشهر: {inspectedCustomer.freeWashesUsedThisMonth} /{' '}
                  {settings.maxFreeWashPerCarPerMonth}
                </span>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                <strong>العرض الحالي:</strong> كل {settings.thresholdLiters} لتر تمنحك{' '}
                <strong>{settings.rewardName}</strong> خلال فترات الهدوء ({settings.freeWashAllowedHours}).
              </div>

              {canClaimFreeWash(inspectedCustomer) && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700">
                    أدخل آخر 3 أرقام من موبايلك لحجز الغسيلة المجانية:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={last3Input}
                      onChange={(e) => setLast3Input(e.target.value)}
                      placeholder="آخر 3 أرقام"
                      className="w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleClaimFromBalancePage}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
                    >
                      احجز غسيلة مجانية
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              لا يوجد سجل نقاط مسجل لهذه النمرة بعد. ستظهر النقاط فور حفظ أول عملية تعبئة في الكازية.
            </div>
          )}

          {customerNotice && (
            <div className="rounded-xl bg-slate-900 p-3 text-xs font-semibold text-white">
              {customerNotice}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-slate-800" />
                صفحة QR العملية (للقراءة فقط)
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                صلاحية {settings.qrExpiryMinutes} دقيقة
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              عند مسح QR الخاص بالعملية، يفتح للزبون عرض قراءة فقط دون إمكانية إدخال كميات أو تعديل الرصيد.
            </p>
          </div>

          {activeQrPreview ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500">رمز العملية</span>
                <span className="font-mono text-xs font-extrabold text-slate-900">
                  {activeQrPreview.qrToken}
                </span>
              </div>
              <p className="text-sm font-extrabold text-emerald-700">
                تمت إضافة {activeQrPreview.addedLiters} لتر، رصيدك {activeQrPreview.balance} من{' '}
                {activeQrPreview.threshold}
              </p>
              <p className="text-xs text-slate-500">
                السيارة: {activeQrPreview.plate} • ينتهي الرمز خلال {activeQrPreview.expiresInMin} دقيقة • فتح الصفحة لا يغيّر الرصيد.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-bold text-slate-800">
                مثال معاينة: "تمت إضافة 40 لتر، رصيدك 114 من {settings.thresholdLiters}"
              </p>
              <p className="text-xs text-slate-500">
                جرّب تسجيل تعبئة من تبويب "شب التاب (الكازية)" لتوليد رمز QR حي للعملية.
              </p>
            </div>
          )}

          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-slate-700">
            <strong>تنويه حول الغسيلة المجانية:</strong> يُخصم الرصيد عند تأكيد مسؤول المغسلة إتمام الغسيلة فعلياً. في حال عدم الحضور بعد {settings.noShowGraceMinutes} دقائق يُلغى الموعد ويبقى الرصيد، وبعد {settings.noShowBanStrikes} مرات متتالية يُعلّق الحجز المسبق لمدة {settings.noShowBanDays} يوماً.
          </div>
        </div>
      </section>

      <section
        id="booking-section"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              حجز موعد (المغسلة وغيار الزيت)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تظهر الأوقات الفاضية فقط لمنع الحجز المكرر. الموقع هو المرجع الموحد للمواعيد.
            </p>
          </div>

          <a
            href={`https://wa.me/963900000000?text=${encodeURIComponent(
              'مرحباً محطة حمدان، أرغب بالاستفسار أو تأكيد حجز موعد.'
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
          >
            <PhoneCall className="h-4 w-4" />
            احجز عبر واتساب (فتح محادثة)
          </a>
        </div>

        <form onSubmit={handleBookingSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-bold mb-1">نوع الخدمة</label>
            <select
              value={bookingForm.serviceType}
              onChange={(e) =>
                setBookingForm((prev) => ({
                  ...prev,
                  serviceType: e.target.value,
                  requestFreeWash: false,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
            >
              <option value="car_wash">
                غسيل سيارة ({settings.washDurationMin} دقيقة — {settings.prices.carWashPrice})
              </option>
              <option value="carpet_wash">
                غسيل سجاد ({settings.washDurationMin} دقيقة — {settings.prices.carpetWashPrice})
              </option>
              <option value="oil_change">
                غيار زيت ({settings.oilDurationMin} دقيقة — يُحدد السعر الفعلي عند الإتمام)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">الوقت المتاح (الأوقات الفاضية فقط)</label>
            <select
              value={bookingForm.timeSlot}
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, timeSlot: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
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
            <label className="block text-xs font-bold mb-1">نمرة السيارة *</label>
            <input
              type="text"
              required
              value={bookingForm.plate}
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, plate: e.target.value }))
              }
              placeholder="مثال: دمشق-90211"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">الاسم الكامل *</label>
            <input
              type="text"
              required
              value={bookingForm.customerName}
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, customerName: e.target.value }))
              }
              placeholder="الاسم الثلاثي"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">رقم الموبايل *</label>
            <input
              type="tel"
              required
              value={bookingForm.phone}
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="09xxxxxxxx"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
            />
          </div>

          {bookingForm.serviceType === 'oil_change' && (
            <>
              <div>
                <label className="block text-xs font-bold mb-1">نوع السيارة وسنة الصنع</label>
                <input
                  type="text"
                  value={bookingForm.carModel}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, carModel: e.target.value }))
                  }
                  placeholder="مثال: كيا سيراتو 2020"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">نوع الزيت (اختياري)</label>
                <input
                  type="text"
                  value={bookingForm.oilType}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, oilType: e.target.value }))
                  }
                  placeholder="مثال: 5W-30"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
            </>
          )}

          <div className={bookingForm.serviceType === 'oil_change' ? '' : 'lg:col-span-2'}>
            <label className="block text-xs font-bold mb-1">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={bookingForm.notes}
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="أي ملاحظات لتجهيز الطلب أو الموعد..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>

          {bookingForm.serviceType === 'car_wash' && (
            <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <input
                id="req-free-wash"
                type="checkbox"
                checked={bookingForm.requestFreeWash}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    requestFreeWash: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-amber-600"
              />
              <label htmlFor="req-free-wash" className="text-xs font-bold text-amber-950">
                طلب استبدال {settings.rewardName} (يتطلب وصول الرصيد إلى {settings.thresholdLiters} لتر وضمن فترات الهدوء)
              </label>
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              تنبيه تذكير يظهر قبل الموعد بساعتين مع إمكانية الإلغاء.
            </span>
            <button
              type="submit"
              disabled={availableSlots.length === 0}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              تأكيد حجز الموعد
            </button>
          </div>
        </form>

        {bookingMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-900">
            {bookingMessage}
          </div>
        )}
      </section>
    </div>
  );
}