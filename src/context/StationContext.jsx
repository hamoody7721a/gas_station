import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  INITIAL_SETTINGS,
  INITIAL_STAFF,
  INITIAL_CUSTOMERS,
  INITIAL_FUEL_LOGS,
  INITIAL_BOOKINGS,
  ALL_SLOTS,
  FUEL_LABELS,
  SERVICE_LABELS,
} from '../data/mockData';

const StationContext = createContext(null);

export function StationProvider({ children }) {
  // الصفحات المتاحة: 'fuel' | 'wash' | 'oil' | 'pump' | 'wash_manager' | 'admin'
  const [activePage, setActivePage] = useState('fuel');

  // المستخدم المسجل دخوله حالياً (للأدوار الإدارية والتشغيلية)
  const [currentUser, setCurrentUser] = useState(null);
  const [loginTargetPage, setLoginTargetPage] = useState(null);

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [fuelLogs, setFuelLogs] = useState(INITIAL_FUEL_LOGS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [activeQrPreview, setActiveQrPreview] = useState(null);
  const [dateFilter, setDateFilter] = useState('2026-11-26');

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'aud-1',
      time: '08:15 ص',
      actor: 'أبو علي (أدمن)',
      action: 'تحديث إعدادات العرض',
      details: 'تثبيت العتبة عند 100 لتر وغسيلة سيارة مجانية كجائزة',
    },
    {
      id: 'aud-2',
      time: '10:15 ص',
      actor: 'رامي',
      action: 'تنبيه كمية كبيرة',
      details: 'تأكيد تعبئة 92 لتر بنزين للسيارة دمشق-77301',
    },
  ]);

  const addAuditLog = (actor, action, details) => {
    const nowTime = new Date().toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: nowTime,
        actor,
        action,
        details,
      },
      ...prev,
    ]);
  };

  // التحقق من صلاحية المستخدم للصفحة المطلوبة
  const isAuthorizedForPage = (page, user = currentUser) => {
    if (page === 'fuel' || page === 'wash' || page === 'oil') return true;
    if (!user || !user.active) return false;
    if (page === 'admin') return user.role === 'admin';
    if (page === 'pump') return user.role === 'pump_attendant' || user.role === 'admin';
    if (page === 'wash_manager') return user.role === 'wash_oil_manager' || user.role === 'admin';
    return false;
  };

  const navigateToPage = (page) => {
    if (isAuthorizedForPage(page)) {
      setActivePage(page);
      setLoginTargetPage(null);
    } else {
      setLoginTargetPage(page);
    }
  };

  const loginStaff = (username, password) => {
    const cleanUser = username.trim();
    const found = staffList.find(
      (s) => s.username.toLowerCase() === cleanUser.toLowerCase() && s.password === password
    );

    if (!found) {
      return { ok: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }
    if (!found.active) {
      return { ok: false, message: 'هذا الحساب موقوف من قبل الأدمن.' };
    }

    setCurrentUser(found);
    addAuditLog(found.name, 'تسجيل دخول', `دخول عبر الحساب (${found.username})`);

    const target = loginTargetPage;
    setLoginTargetPage(null);

    if (target && isAuthorizedForPage(target, found)) {
      setActivePage(target);
    } else if (found.role === 'admin') {
      setActivePage('admin');
    } else if (found.role === 'pump_attendant') {
      setActivePage('pump');
    } else if (found.role === 'wash_oil_manager') {
      setActivePage('wash_manager');
    }

    return { ok: true, message: `أهلاً بك ${found.name}` };
  };

  const logoutStaff = () => {
    if (currentUser) {
      addAuditLog(currentUser.name, 'تسجيل خروج', 'إنهاء الجلسة');
    }
    setCurrentUser(null);
    setActivePage('fuel');
  };

  const bookedSlotsSet = useMemo(() => {
    return new Set(
      bookings
        .filter((b) => b.status === 'upcoming' || b.status === 'completed')
        .map((b) => b.timeSlot)
    );
  }, [bookings]);

  const availableSlots = useMemo(() => {
    return ALL_SLOTS.filter((slot) => !bookedSlotsSet.has(slot));
  }, [bookedSlotsSet]);

  const canClaimFreeWash = (cust) => {
    if (!cust) return false;
    if (cust.litersBalance < settings.thresholdLiters) return false;
    if (cust.freeWashesUsedThisMonth >= settings.maxFreeWashPerCarPerMonth) return false;
    if (cust.freeWashBanUntil) return false;
    return true;
  };

  const recordRefuel = ({ fuelType, liters, plate, phone }) => {
    const litersNum = parseFloat(liters);
    const alertLimit =
      fuelType === 'benzine'
        ? settings.largeQtyAlertLiters.benzine
        : settings.largeQtyAlertLiters.mazout;

    const isLarge = litersNum > alertLimit;
    const factor = settings.fuelFactors[fuelType] || 1;
    const pointsAdded = Math.round(litersNum * factor);
    const priceAtTime =
      fuelType === 'benzine'
        ? settings.prices.benzinePerLiter
        : settings.prices.mazoutPerLiter;
    const estimatedAmount = Number((litersNum * priceAtTime).toFixed(2));
    const nowTime = new Date().toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const existing = customers[plate] || {
      plate,
      phoneLast3: phone ? phone.slice(-3) : '000',
      phoneMasked: phone ? `*** *** ${phone.slice(-3)}` : 'غير مسجل',
      litersBalance: 0,
      lastRefuelDate: dateFilter,
      freeWashesUsedThisMonth: 0,
      consecutiveNoShows: 0,
      freeWashBanUntil: null,
    };

    const updatedBalance = existing.litersBalance + pointsAdded;
    const reachedThreshold = updatedBalance >= settings.thresholdLiters;

    setCustomers((prev) => ({
      ...prev,
      [plate]: {
        ...existing,
        litersBalance: updatedBalance,
        lastRefuelDate: dateFilter,
      },
    }));

    const actorName = currentUser ? currentUser.name : 'شب التاب';
    const qrToken = `QR-${plate.replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog = {
      id: `fl-${Date.now()}`,
      time: nowTime,
      date: dateFilter,
      plate,
      fuelType,
      liters: litersNum,
      factor,
      pointsAdded,
      pricePerLiterAtTime: priceAtTime,
      estimatedAmount,
      attendantName: actorName,
      flaggedLarge: isLarge,
      qrToken,
      qrExpiresInMin: settings.qrExpiryMinutes,
    };

    setFuelLogs((prev) => [newLog, ...prev]);
    addAuditLog(
      actorName,
      'تسجيل تعبئة وقود',
      `${FUEL_LABELS[fuelType]} ${litersNum} لتر للسيارة ${plate} (الرصيد الجديد: ${updatedBalance} لتر)`
    );

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hamdan.station';
    const qrUrl = `${origin}/receipt?token=${encodeURIComponent(qrToken)}&plate=${encodeURIComponent(
      plate
    )}&added=${pointsAdded}&balance=${updatedBalance}&threshold=${settings.thresholdLiters}`;

    const qrData = {
      plate,
      addedLiters: pointsAdded,
      balance: updatedBalance,
      threshold: settings.thresholdLiters,
      qrToken,
      qrUrl,
      expiresInMin: settings.qrExpiryMinutes,
    };
    setActiveQrPreview(qrData);

    return { updatedBalance, reachedThreshold, pointsAdded };
  };

  const editFuelLog = (logId, newLitersVal) => {
    const newLiters = parseFloat(newLitersVal);
    if (isNaN(newLiters) || newLiters <= 0) return;

    const targetLog = fuelLogs.find((item) => item.id === logId);
    if (!targetLog) return;

    const diffLiters = newLiters - targetLog.liters;
    const newAmount = Number((newLiters * targetLog.pricePerLiterAtTime).toFixed(2));

    setFuelLogs((prev) =>
      prev.map((item) =>
        item.id === logId
          ? {
              ...item,
              liters: newLiters,
              pointsAdded: Math.round(newLiters * item.factor),
              estimatedAmount: newAmount,
            }
          : item
      )
    );

    setCustomers((prev) => {
      const cust = prev[targetLog.plate];
      if (!cust) return prev;
      return {
        ...prev,
        [targetLog.plate]: {
          ...cust,
          litersBalance: Math.max(0, cust.litersBalance + Math.round(diffLiters * targetLog.factor)),
        },
      };
    });

    const actorName = currentUser ? currentUser.name : 'موظف الكازية';
    addAuditLog(
      actorName,
      'تعديل عملية تعبئة',
      `السيارة ${targetLog.plate}: تعديل الكمية من ${targetLog.liters} لتر إلى ${newLiters} لتر`
    );
  };

  const createBooking = (form, creatorRole = 'customer') => {
    const plate = form.plate.trim();
    const customerName = form.customerName.trim();
    const phone = form.phone.trim();
    const slot = form.timeSlot;

    if (!plate || !customerName || !phone || !slot) {
      return { ok: false, message: 'يرجى تعبئة نمرة السيارة، الاسم، رقم الموبايل، والوقت.' };
    }

    if (bookedSlotsSet.has(slot)) {
      return { ok: false, message: 'هالوقت انحجز، اختار وقت ثاني.' };
    }

    const cust = customers[plate];
    let isFreeWash = false;

    if (form.requestFreeWash && form.serviceType === 'car_wash') {
      if (!cust || cust.litersBalance < settings.thresholdLiters) {
        return { ok: false, message: 'الرصيد لم يصل بعد إلى عتبة الغسيلة المجانية.' };
      }
      if (cust.freeWashBanUntil) {
        return { ok: false, message: 'هذه السيارة مقيدة مؤقتاً من الحجز المسبق للغسيلة المجانية.' };
      }
      if (cust.freeWashesUsedThisMonth >= settings.maxFreeWashPerCarPerMonth) {
        return { ok: false, message: 'تم استهلاك الحد الأقصى للغسيلات المجانية لهذه السيارة هذا الشهر.' };
      }
      const sameSlotFreeCount = bookings.filter(
        (b) => b.timeSlot === slot && b.isFreeWash && b.status !== 'cancelled'
      ).length;
      if (sameSlotFreeCount >= settings.maxFreeWashPerSlot) {
        return { ok: false, message: 'تم حجز مقعد الغسيلة المجانية المحدد في هذه الفترة.' };
      }
      isFreeWash = true;
    }

    const defaultAmount =
      form.serviceType === 'car_wash'
        ? isFreeWash
          ? 0
          : settings.prices.carWashPrice
        : form.serviceType === 'carpet_wash'
        ? settings.prices.carpetWashPrice
        : null;

    const newBooking = {
      id: `bk-${Date.now()}`,
      timeSlot: slot,
      serviceType: form.serviceType,
      plate,
      customerName,
      phone,
      source: creatorRole === 'wash_oil_manager' ? 'واتساب / إضافة يدوية' : 'الموقع',
      status: 'upcoming',
      isFreeWash,
      carModel: form.carModel || '',
      oilType: form.oilType || '',
      notes: form.notes || '',
      actualAmount: defaultAmount,
    };

    setBookings((prev) => [...prev, newBooking]);
    const actorName = currentUser ? currentUser.name : 'الزبون';
    addAuditLog(
      actorName,
      'إضافة حجز جديد',
      `${SERVICE_LABELS[form.serviceType]} للسيارة ${plate} الساعة ${slot}${
        isFreeWash ? ' (غسيلة مجانية - تُخصم عند التأكيد)' : ''
      }`
    );

    return { ok: true, message: 'تم تسجيل الموعد بنجاح في روزنامة المحطة.' };
  };

  const completeBooking = (booking, oilActualAmount = null) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              status: 'completed',
              actualAmount:
                booking.serviceType === 'oil_change'
                  ? Number(oilActualAmount || 0)
                  : booking.isFreeWash
                  ? 0
                  : booking.serviceType === 'car_wash'
                  ? settings.prices.carWashPrice
                  : settings.prices.carpetWashPrice,
            }
          : b
      )
    );

    const actorName = currentUser ? currentUser.name : 'مسؤول المغسلة';

    if (booking.isFreeWash) {
      setCustomers((prev) => {
        const cust = prev[booking.plate];
        if (!cust) return prev;
        return {
          ...prev,
          [booking.plate]: {
            ...cust,
            litersBalance: Math.max(0, cust.litersBalance - settings.thresholdLiters),
            freeWashesUsedThisMonth: cust.freeWashesUsedThisMonth + 1,
            consecutiveNoShows: 0,
          },
        };
      });
      addAuditLog(
        actorName,
        'تأكيد غسيلة مجانية وخصم النقاط',
        `تم تنفيذ الغسيلة المجانية للسيارة ${booking.plate} وخصم ${settings.thresholdLiters} لتر.`
      );
      return `تم تأكيد الغسيلة المجانية للسيارة (${booking.plate}) وخصم ${settings.thresholdLiters} لتر.`;
    }

    if (booking.serviceType === 'oil_change') {
      addAuditLog(
        actorName,
        'تأكيد غيار زيت وتسجيل المبلغ الفعلي',
        `السيارة ${booking.plate} — المبلغ الفعلي: ${oilActualAmount}`
      );
      return `تم تأكيد غيار الزيت للسيارة (${booking.plate}) بمبلغ ${oilActualAmount}.`;
    }

    addAuditLog(
      actorName,
      'تأكيد إتمام موعد',
      `تم إنجاز ${SERVICE_LABELS[booking.serviceType]} للسيارة ${booking.plate}`
    );
    return `تم تأكيد إتمام الخدمة للسيارة (${booking.plate}).`;
  };

  const addWalkInService = (plate, serviceType, isFree) => {
    const cust = customers[plate];
    const amount =
      serviceType === 'car_wash'
        ? isFree
          ? 0
          : settings.prices.carWashPrice
        : settings.prices.carpetWashPrice;

    const nowTime = new Date().toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setBookings((prev) => [
      ...prev,
      {
        id: `bk-walk-${Date.now()}`,
        timeSlot: nowTime,
        serviceType,
        plate,
        customerName: 'زبون عابر',
        phone: '-',
        source: 'بدون حجز (عابر)',
        status: 'completed',
        isFreeWash: isFree,
        carModel: '',
        oilType: '',
        notes: isFree ? 'استبدال غسيلة مجانية فورية' : 'خدمة فورية بدون حجز مسبق',
        actualAmount: amount,
      },
    ]);

    if (isFree && cust) {
      setCustomers((prev) => ({
        ...prev,
        [plate]: {
          ...cust,
          litersBalance: Math.max(0, cust.litersBalance - settings.thresholdLiters),
          freeWashesUsedThisMonth: cust.freeWashesUsedThisMonth + 1,
        },
      }));
    }

    const actorName = currentUser ? currentUser.name : 'مسؤول المغسلة';
    addAuditLog(
      actorName,
      isFree ? 'إضافة غسيلة مجانية لزبون عابر' : 'إضافة خدمة لزبون عابر',
      `${SERVICE_LABELS[serviceType]} للسيارة ${plate}${isFree ? ' (خصم العتبة)' : ''}`
    );
  };

  const addStaff = (form) => {
    const created = {
      id: `st-${Date.now()}`,
      name: form.name.trim(),
      role: form.role,
      username: form.username.trim(),
      password: form.password.trim() || '123',
      active: true,
      shiftNote: form.shiftNote.trim() || 'حساب جديد',
    };
    setStaffList((prev) => [...prev, created]);
    addAuditLog(
      currentUser?.name || 'الأدمن',
      'إنشاء حساب موظف',
      `إنشاء حساب ${created.name} (${created.username})`
    );
  };

  const toggleStaffActive = (staffId) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const nextActive = !s.active;
        addAuditLog(
          currentUser?.name || 'الأدمن',
          nextActive ? 'تفعيل حساب موظف' : 'إيقاف حساب موظف',
          `الحساب: ${s.name}`
        );
        return { ...s, active: nextActive };
      })
    );
  };

  const setStaffPasswordByAdmin = (staffId, newPass) => {
    const trimmed = newPass.trim();
    if (!trimmed) return;
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        addAuditLog(
          currentUser?.name || 'الأدمن',
          'تعيين كلمة سر جديدة',
          `تم تعيين كلمة سر جديدة للموظف ${s.name}`
        );
        return { ...s, password: trimmed };
      })
    );
  };

  const adjustCustomerBalance = (plate, delta, reason) => {
    if (!customers[plate]) return;
    const oldBal = customers[plate].litersBalance;
    const newBal = Math.max(0, oldBal + delta);
    setCustomers((prev) => ({
      ...prev,
      [plate]: { ...prev[plate], litersBalance: newBal },
    }));
    addAuditLog(
      currentUser?.name || 'الأدمن',
      'تعديل رصيد نقاط يدوياً',
      `السيارة ${plate}: من ${oldBal} إلى ${newBal} لتر — السبب: ${reason || 'تسوية إدارية'}`
    );
  };

  return (
    <StationContext.Provider
      value={{
        activePage,
        navigateToPage,
        loginTargetPage,
        setLoginTargetPage,
        currentUser,
        loginStaff,
        logoutStaff,
        settings,
        setSettings,
        staffList,
        customers,
        fuelLogs,
        bookings,
        auditLogs,
        activeQrPreview,
        dateFilter,
        setDateFilter,
        availableSlots,
        canClaimFreeWash,
        recordRefuel,
        editFuelLog,
        createBooking,
        completeBooking,
        addWalkInService,
        addStaff,
        toggleStaffActive,
        setStaffPasswordByAdmin,
        adjustCustomerBalance,
      }}
    >
      {children}
    </StationContext.Provider>
  );
}

export const useStation = () => useContext(StationContext);