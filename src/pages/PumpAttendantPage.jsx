import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Fuel } from 'lucide-react';
import { useStation } from '../context/StationContext';
import { FUEL_LABELS } from '../data/mockData';

export default function PumpAttendantPage() {
  const {
    settings,
    fuelLogs,
    dateFilter,
    recordRefuel,
    editFuelLog,
    activeQrPreview,
  } = useStation();

  const [pumpForm, setPumpForm] = useState({
    fuelType: 'benzine',
    liters: '',
    plate: '',
    phone: '',
  });
  const [pendingLargeConfirm, setPendingLargeConfirm] = useState(false);
  const [pumpAlert, setPumpAlert] = useState(null);
  const [editingFuelId, setEditingFuelId] = useState(null);
  const [editLitersValue, setEditLitersValue] = useState('');

  const filteredFuelLogs = dateFilter
    ? fuelLogs.filter((f) => f.date === dateFilter)
    : fuelLogs;

  const handleSubmit = (e, bypassLargeCheck = false) => {
    if (e) e.preventDefault();
    const plate = pumpForm.plate.trim();
    const litersNum = parseFloat(pumpForm.liters);

    if (!plate || isNaN(litersNum) || litersNum <= 0) {
      setPumpAlert({
        type: 'error',
        text: 'يرجى إدخال نمرة السيارة وكمية الوقود بشكل صحيح.',
      });
      return;
    }

    const alertLimit =
      pumpForm.fuelType === 'benzine'
        ? settings.largeQtyAlertLiters.benzine
        : settings.largeQtyAlertLiters.mazout;

    if (litersNum > alertLimit && !bypassLargeCheck && !pendingLargeConfirm) {
      setPendingLargeConfirm(true);
      setPumpAlert({
        type: 'warning',
        text: `الكمية (${litersNum} لتر) أكبر من حد التنبيه (${alertLimit} لتر). هل أنت متأكد من حفظ العملية؟`,
      });
      return;
    }

    const { updatedBalance, reachedThreshold, pointsAdded } = recordRefuel({
      fuelType: pumpForm.fuelType,
      liters: litersNum,
      plate,
      phone: pumpForm.phone,
    });

    setPumpAlert({
      type: reachedThreshold ? 'reward' : 'success',
      text: reachedThreshold
        ? `تم حفظ العملية! السيارة (${plate}) وصلت للعتبة (${updatedBalance}/${settings.thresholdLiters} لتر) — أخبر الزبون شفهياً باستحقاق ${settings.rewardName}.`
        : `تم حفظ العملية بنجاح وإضافة ${pointsAdded} نقطة. رصيد السيارة الآن: ${updatedBalance} لتر.`,
    });

    setPumpForm({ fuelType: pumpForm.fuelType, liters: '', plate: '', phone: '' });
    setPendingLargeConfirm(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Fuel className="h-5 w-5 text-amber-600" />
            شاشة تسجيل التعبئة (الكازية)
          </h2>
          <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
            إلزامي لكل تعبئة
          </span>
        </div>

        <p className="text-xs text-slate-500">
          سجّل كل تعبئة فوراً حتى لو لم يطلب الزبون QR أو نقاط، لضمان دقة الحصيلة والداشبورد.
        </p>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">نوع الوقود</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPumpForm((p) => ({ ...p, fuelType: 'benzine' }));
                  setPendingLargeConfirm(false);
                }}
                className={`rounded-xl border p-3 text-sm font-extrabold transition ${
                  pumpForm.fuelType === 'benzine'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                بنزين ({settings.prices.benzinePerLiter}/لتر)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPumpForm((p) => ({ ...p, fuelType: 'mazout' }));
                  setPendingLargeConfirm(false);
                }}
                className={`rounded-xl border p-3 text-sm font-extrabold transition ${
                  pumpForm.fuelType === 'mazout'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                مازوت ({settings.prices.mazoutPerLiter}/لتر)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">الكمية (باللترات) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={pumpForm.liters}
              onChange={(e) => {
                setPumpForm((p) => ({ ...p, liters: e.target.value }));
                setPendingLargeConfirm(false);
              }}
              placeholder="مثال: 35"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">نمرة السيارة *</label>
            <input
              type="text"
              required
              value={pumpForm.plate}
              onChange={(e) => setPumpForm((p) => ({ ...p, plate: e.target.value }))}
              placeholder="مثال: دمشق-44812"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">رقم موبايل الزبون (اختياري)</label>
            <input
              type="tel"
              value={pumpForm.phone}
              onChange={(e) => setPumpForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="اختياري لإرسال تأكيد"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            />
          </div>

          {pendingLargeConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500"
              >
                الكمية كبيرة، متأكد — حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingLargeConfirm(false);
                  setPumpAlert(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              حفظ العملية وتوليد QR
            </button>
          )}
        </form>

        {pumpAlert && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-bold leading-relaxed ${
              pumpAlert.type === 'reward'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : pumpAlert.type === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-950'
                : pumpAlert.type === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-900'
                : 'border-sky-300 bg-sky-50 text-sky-950'
            }`}
          >
            {pumpAlert.text}
          </div>
        )}

        {activeQrPreview && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-slate-900">
                QR جاهز للمسح: {activeQrPreview.qrToken}
              </div>
              <div className="text-[11px] font-bold text-emerald-700">
                تمت إضافة {activeQrPreview.addedLiters} لتر، رصيدك {activeQrPreview.balance} من{' '}
                {activeQrPreview.threshold}
              </div>
              <div className="text-[11px] text-slate-500">
                صلاحية {activeQrPreview.expiresInMin} دقيقة • قراءة فقط
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2 shrink-0">
              <QRCodeSVG value={activeQrPreview.qrUrl} size={88} level="M" />
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">عمليات التعبئة المسجلة اليوم</h3>
          <span className="text-xs text-slate-500">
            يمكن تعديل خطأ الإدخال مع توثيق التعديل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-2">الوقت</th>
                <th className="py-2.5 px-2">النمرة</th>
                <th className="py-2.5 px-2">الوقود</th>
                <th className="py-2.5 px-2">الكمية</th>
                <th className="py-2.5 px-2">الموظف</th>
                <th className="py-2.5 px-2">تعديل خطأ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFuelLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 whitespace-nowrap">{log.time}</td>
                  <td className="py-2.5 px-2 font-bold whitespace-nowrap">{log.plate}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{FUEL_LABELS[log.fuelType]}</td>
                  <td className="py-2.5 px-2 font-extrabold whitespace-nowrap">
                    {editingFuelId === log.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editLitersValue}
                        onChange={(e) => setEditLitersValue(e.target.value)}
                        className="w-20 rounded border border-amber-400 px-2 py-1 text-xs"
                      />
                    ) : (
                      <>
                        {log.liters} لتر
                        {log.flaggedLarge && (
                          <span className="mr-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            كبيرة
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{log.attendantName}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    {editingFuelId === log.id ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            editFuelLog(log.id, editLitersValue);
                            setEditingFuelId(null);
                          }}
                          className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFuelId(null)}
                          className="rounded bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFuelId(log.id);
                          setEditLitersValue(String(log.liters));
                        }}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        تعديل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}