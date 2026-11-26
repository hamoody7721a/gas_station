import React from 'react';
import {
  Fuel,
  Droplets,
  Wrench,
  LayoutDashboard,
  UserCheck,
  LogOut,
  Lock,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export default function Navbar() {
  const { activePage, navigateToPage, currentUser, logoutStaff, settings } = useStation();

  const navItems = [
    { id: 'fuel', label: 'الكازية والنقاط', icon: Fuel, protected: false },
    { id: 'wash', label: 'المغسلة', icon: Droplets, protected: false },
    { id: 'oil', label: 'غيار الزيت', icon: Wrench, protected: false },
    { id: 'pump', label: 'شب التاب', icon: Fuel, protected: true },
    { id: 'wash_manager', label: 'مسؤول المغسلة والزيت', icon: Droplets, protected: true },
    { id: 'admin', label: 'الأدمن', icon: LayoutDashboard, protected: true },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-900 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold leading-tight sm:text-lg">
              {settings.stationName}
            </h1>
            <p className="text-xs text-slate-300">
              الكازية • المغسلة (سيارات وسجاد) • غيار الزيت
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const needsLock = item.protected && !currentUser;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateToPage(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {needsLock && <Lock className="h-3 w-3 text-amber-300" />}
              </button>
            );
          })}
        </nav>
      </div>

      {currentUser && (
        <div className="border-t border-slate-800 bg-slate-950/85 px-4 py-1.5 text-xs text-slate-300">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                مسجل الدخول: <strong className="text-white">{currentUser.name}</strong> ({currentUser.username}) — {currentUser.shiftNote}
              </span>
            </div>
            <button
              type="button"
              onClick={logoutStaff}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              تسجيل خروج
            </button>
          </div>
        </div>
      )}
    </header>
  );
}