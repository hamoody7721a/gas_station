import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Fuel, Award, Search, QrCode, ArrowLeft } from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function FuelStationPage() {
  const {
    settings,
    customers,
    canClaimFreeWash,
    activeQrPreview,
    navigateToPage,
  } = useStation();

  const [lookupPlate, setLookupPlate] = useState('دمشق-90211');
  const [last3Input, setLast3Input] = useState('');
  const [notice, setNotice] = useState('');

  const inspectedCustomer = useMemo(() => {
    const key = lookupPlate.trim();
    if (!key) return null;
    return customers[key] || null;
  }, [lookupPlate, customers]);

  const handleGoToFreeWashBooking = () => {
    setNotice('');
    if (!inspectedCustomer || !canClaimFreeWash(inspectedCustomer)) {
      setNotice('السيارة غير مؤهلة حالياً للغسيلة المجانية.');
      return;
    }
    if (
      inspectedCustomer.phoneLast3 &&
      inspectedCustomer.phoneLast3 !== '000' &&
      last3Input.trim() !== inspectedCustomer.phoneLast3
    ) {
      setNotice('أدخل آخر 3 أرقام من رقم الموبايل المسجل للتحقق.');
      return;
    }
    navigateToPage('wash');
  };

  const qrValue = activeQrPreview
    ? activeQrPreview.qrUrl
    : `https://hamdan.station/balance?plate=${encodeURIComponent(lookupPlate || 'دمشق-90211')}`;

  return (
    <div className="space-y-6">
      {/* تعريف الكازية ونظام النقاط */}
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
              <Award className="h-3.5 w-3.5" />
              كل {settings.thresholdLiters} لتر = {settings.rewardName}
            </span>
            <h2 className="text-2xl font-black">الكازية ونظام النقاط</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              بنزين ({settings.prices.benzinePerLiter}/لتر) ومازوت ({settings.prices.mazoutPerLiter}/لتر). كل لتر وقود يُسجّل كـ نقطة برصيد سيارتك (صلاحية {settings.pointsExpiryDays} يوماً).
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs">
            <Fuel className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-slate-400">الحد الأقصى للغسيل المجاني</div>
              <div className="font-extrabold text-white">
                {settings.maxFreeWashPerCarPerMonth} / شهر لكل سيارة
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* فحص الرصيد + رمز QR حقيقي */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-600" />
            فحص رصيد السيارة (بدون حساب)
          </h3>

          <input
            type="text"
            value={lookupPlate}
            onChange={(e) => {
              setLookupPlate(e.target.value);
              setNotice('');
            }}
            placeholder="أدخل نمرة السيارة (مثال: دمشق-90211)"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold focus:border-amber-500 focus:outline-none"
          />

          {inspectedCustomer ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm">{inspectedCustomer.plate}</span>
                <span className="text-slate-500" dir="ltr">
                  {inspectedCustomer.phoneMasked}
                </span>
              </div>

              <div>
                <div className="mb-1 flex justify-between font-bold">
                  <span>الرصيد: {inspectedCustomer.litersBalance} لتر</span>
                  <span>العتبة: {settings.thresholdLiters} لتر</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-amber-500"
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

              {canClaimFreeWash(inspectedCustomer) && (
                <div className="space-y-2 pt-1">
                  <label className="block font-bold text-emerald-900">
                    السيارة مؤهلة لـ {settings.rewardName}! أدخل آخر 3 أرقام من الموبايل:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={last3Input}
                      onChange={(e) => setLast3Input(e.target.value)}
                      placeholder="آخر 3 أرقام"
                      className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleGoToFreeWashBooking}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
                    >
                      حجز الغسيلة المجانية
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              لا يوجد رصيد مسجل لهذه النمرة بعد.
            </div>
          )}

          {notice && (
            <div className="rounded-xl bg-slate-900 p-3 text-xs font-bold text-white">
              {notice}
            </div>
          )}
        </div>

        {/* رمز QR حقيقي للقراءة فقط */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-right">
            <div className="inline-flex items-center gap-1.5 text-base font-black text-slate-900">
              <QrCode className="h-5 w-5 text-slate-800" />
              رمز QR للعملية (للقراءة فقط)
            </div>
            {activeQrPreview ? (
              <p className="text-xs font-bold text-emerald-700">
                تمت إضافة {activeQrPreview.addedLiters} لتر، رصيدك {activeQrPreview.balance} من{' '}
                {activeQrPreview.threshold}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                يولّد تلقائياً عند تسجيل تعبئة في شاشة شب التاب، ومدة صلاحيته {settings.qrExpiryMinutes} دقيقة.
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              فتح الرابط لا يغيّر الرصيد ولا يسمح بإدخال كميات.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shrink-0">
            <QRCodeSVG value={qrValue} size={112} level="M" />
          </div>
        </div>
      </section>
    </div>
  );
}