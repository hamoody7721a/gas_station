import React from 'react';
import { StationProvider, useStation } from './context/StationContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import FuelStationPage from './pages/FuelStationPage';
import CarWashPage from './pages/CarWashPage';
import OilChangePage from './pages/OilChangePage';
import PumpAttendantPage from './pages/PumpAttendantPage';
import WashOilManagerPage from './pages/WashOilManagerPage';
import AdminPage from './pages/AdminPage';

function StationContent() {
  const { activePage } = useStation();

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <LoginModal />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {activePage === 'fuel' && <FuelStationPage />}
        {activePage === 'wash' && <CarWashPage />}
        {activePage === 'oil' && <OilChangePage />}
        {activePage === 'pump' && <PumpAttendantPage />}
        {activePage === 'wash_manager' && <WashOilManagerPage />}
        {activePage === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StationProvider>
      <StationContent />
    </StationProvider>
  );
}