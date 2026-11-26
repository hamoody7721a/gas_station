import React, { useState } from 'react';
import { Lock, User, X } from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function LoginModal() {
  const { loginTargetPage, setLoginTargetPage, loginStaff, staffList } = useStation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!loginTargetPage) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginStaff(username, password);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setUsername('');
    setPassword('');
  };

  const quickFill = (user) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
            <Lock className="h-5 w-5 text-amber-600" />
            تسجيل دخول الموظفين والأدمن
          </h2>
          <button
            type="button"
            onClick={() => {
              setLoginTargetPage(null);
              setErrorMsg('');
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          أدخل اسم المستخدم وكلمة المرور للوصول إلى الشاشة المطلوبة. يبقى التاب مسجلاً طوال الوردية بعد الدخول.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: admin أو samer_pump"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-9 font-bold focus:border-amber-500 focus:outline-none"
              />
              <User className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold focus:border-amber-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-800">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            دخول
          </button>
        </form>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[11px] font-bold text-slate-500">
            تعبئة سريعة للتجربة (كلمة السر الافتراضية: 123):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {staffList
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => quickFill(s)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                >
                  {s.name} ({s.username})
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}