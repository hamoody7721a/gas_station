import React, { useState } from 'react';
import { PlusCircle, Droplets, CheckCircle2 } from 'lucide-react';
import { useStation } from '../context/StationContext';
import { SERVICE_LABELS, STATUS_LABELS } from '../data/mockData';

export default function WashOilManagerPage() {
  const {
    settings,
    customers,
    bookings,
    availableSlots,
    canClaimFreeWash,
    createBooking,
    completeBooking,
    addWalkInService,
  } = useStation();

  const [bookingForm, setBookingForm] = useState({
    serviceType: 'car_wash',
    timeSlot: availableSlots[0] || '',
    plate: '',
    customerName: '',
    phone: '',
  });

  const [walkInPlate, setWalkInPlate] = useState('');
  const [walkInType, setWalkInType] = useState('car_wash');
  const [walkInFreeConfirm, setWalkInFreeConfirm] = useState(false);

  const [oilCompletionModal, setOilCompletionModal] = useState(null);
  const [oilActualPriceInput, setOilActualPriceInput] = useState('');
  const [washNotice, setWashNotice] = useState('');

  const handleAddManualBooking = (e) => {
    e.preventDefault();
    const res = createBooking(bookingForm, 'wash_oil_manager');
    setWashNotice(res.message);
    if (res.ok) {
      setBookingForm((p) => ({
        ...p,
        timeSlot: availableSlots.find((s) => s !== p.timeSlot) || '',
        plate: '',
        customerName: '',
        phone: '',
      }));
    }
  };

  const handleWalkInSubmit = (e) => {
    e.preventDefault();
    const plate = walkInPlate.trim();
    if (!plate) return;

    const cust = customers[plate];
    const eligible = walkInType === 'car_wash' && canClaimFreeWash(cust);

    if (eligible && !walkInFreeConfirm) {
      setWalkInFreeConfirm(true);
      setWashNotice(
        `السيارة (${plate}) تملك غسيلة مجانية (${cust.litersBalance} لتر). اضغط "تأكيد الغسيلة المجانية" لخصم الرصيد وتسجيلها.`
      );
      return;
    }

    const isFree = Boolean(eligible && walkInFreeConfirm);
    addWalkInService(plate, walkInType, isFree);

    setWashNotice(
      isFree
        ? `تم تسجيل الغسيلة المجانية للسيارة (${plate}) وخصم ${settings.thresholdLiters} لتر.`
        : `تم تسجيل ${SERVICE_LABELS[walkInType]} للسيارة (${plate}) في حصيلة اليوم.`
    );
    setWalkInPlate('');
    setWalkInFreeConfirm(false);
  };

  const handleCompleteClick = (booking) => {
    if (booking.serviceType === 'oil_change') {
      setOilCompletionModal(booking);
      setOilActualPriceInput('25');
      return;
    }
    const msg = completeBooking(booking);
    setWashNotice(msg);
  };

  const confirmOilCompletion = () => {
    if (!oilCompletionModal) return;
    const msg = completeBooking(oilCompletionModal, oilActualPriceInput);
    setWashNotice(msg);
    setOilCompletionModal(null);
    setOilActualPriceInput('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-sky-600" />
            أضف حجز (جسر الواتساب والمواعيد الشفهية)
          </h3>
          <p className="text-xs text-slate-500">
            سجّل فوراً أي حجز وصل عبر واتساب أو اتصال حتى يُحجز الوقت في الروزنامة ولا يتكرر.
          </p>

          <form onSubmit={handleAddManualBooking} className="grid gap-3 sm:grid-cols-2">
            <select
              value={bookingForm.serviceType}
              onChange={(e) => setBookingForm((p) => ({ ...p, serviceType: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
            >
              <option value="car_wash">غسيل سيارة</option>
              <option value="carpet_wash">غسيل سجاد</option>
              <option value="oil_change">غيار زيت</option>
            </select>

            <select
              value={bookingForm.timeSlot}
              onChange={(e) => setBookingForm((p) => ({ ...p, timeSlot: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
            >
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot} (متاح)
                </option>
              ))}
            </select>

            <input
              type="text"
              required
              value={bookingForm.plate}
              onChange={(e) => setBookingForm((p) => ({ ...p, plate: e.target.value }))}
              placeholder="نمرة السيارة *"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
            />

            <input
              type="text"
              required
              value={bookingForm.customerName}
              onChange={(e) => setBookingForm((p) => ({ ...p, customerName: e.target.value }))}
              placeholder="اسم الزبون *"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
            />

            <input
              type="tel"
              required
              value={bookingForm.phone}
              onChange={(e) => setBookingForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="رقم الموبايل *"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
            />

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-sky-500"
            >
              إضافة للروزنامة
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black flex items-center gap-2">
            <Droplets className="h-5 w-5 text-emerald-600" />
            أضف غسيلة (بدون حجز / زبون عابر)
          </h3>
          <p className="text-xs text-slate-500">
            أدخل نمرة السيارة فقط لتسجيل الزبون العابر أو التحقق تلقائياً من استحقاق غسيلة مجانية.
          </p>

          <form onSubmit={handleWalkInSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                required
                value={walkInPlate}
                onChange={(e) => {
                  setWalkInPlate(e.target.value);
                  setWalkInFreeConfirm(false);
                }}
                placeholder="نمرة السيارة (مثال: دمشق-90211)"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              />
              <select
                value={walkInType}
                onChange={(e) => {
                  setWalkInType(e.target.value);
                  setWalkInFreeConfirm(false);
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              >
                <option value="car_wash">غسيل سيارة</option>
                <option value="carpet_wash">غسيل سجاد</option>
              </select>
            </div>

            {walkInPlate.trim() &&
              walkInType === 'car_wash' &&
              canClaimFreeWash(customers[walkInPlate.trim()]) && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-extrabold text-emerald-900">
                  السيارة ({walkInPlate.trim()}) تملك غسيلة مجانية ({customers[walkInPlate.trim()].litersBalance} لتر).
                </div>
              )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
            >
              {walkInFreeConfirm ? 'تأكيد الغسيلة المجانية وخصم النقاط' : 'حفظ الغسيلة'}
            </button>
          </form>
        </div>
      </div>

      {washNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-950">
          {washNotice}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black">قائمة حجوزات اليوم (مرتبة بالوقت)</h2>
          <span className="text-xs text-slate-500">
            الضغط على "تمت" يوثق التنفيذ ويخصم نقاط الغسيلة المجانية أو يطلب المبلغ الفعلي للزيت.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">الوقت</th>
                <th className="py-2.5 px-2">نمرة السيارة</th>
                <th className="py-2.5 px-2">الخدمة</th>
                <th className="py-2.5 px-2">الاسم والموبايل</th>
                <th className="py-2.5 px-2">تفاصيل إضافية</th>
                <th className="py-2.5 px-2">الحالة</th>
                <th className="py-2.5 px-2">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-bold whitespace-nowrap">{b.timeSlot}</td>
                  <td className="py-3 px-2 font-extrabold whitespace-nowrap">
                    {b.plate}
                    {b.isFreeWash && (
                      <span className="mr-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        غسيلة مجانية
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">{SERVICE_LABELS[b.serviceType]}</td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="font-bold">{b.customerName}</div>
                    <div className="text-slate-500" dir="ltr">
                      {b.phone}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-600 max-w-xs">
                    {b.carModel && <div>السيارة: {b.carModel}</div>}
                    {b.oilType && <div>الزيت: {b.oilType}</div>}
                    {b.notes && <div>{b.notes}</div>}
                    {b.status === 'completed' && b.actualAmount !== null && (
                      <div className="font-bold text-slate-800">
                        المبلغ المسجل: {b.actualAmount}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        b.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'upcoming'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {b.status === 'upcoming' ? (
                      <button
                        type="button"
                        onClick={() => handleCompleteClick(b)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-slate-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        تمت
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {oilCompletionModal && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-md space-y-3">
          <h4 className="text-sm font-black text-amber-950">
            تأكيد إتمام غيار الزيت للسيارة ({oilCompletionModal.plate}) — أدخل المبلغ الفعلي
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              step="0.5"
              min="0"
              value={oilActualPriceInput}
              onChange={(e) => setOilActualPriceInput(e.target.value)}
              className="w-40 rounded-xl border border-amber-400 bg-white px-3 py-2 text-sm font-black"
            />
            <button
              type="button"
              onClick={confirmOilCompletion}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
            >
              تأكيد وحفظ المبلغ
            </button>
            <button
              type="button"
              onClick={() => setOilCompletionModal(null)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}