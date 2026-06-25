import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import IAChat from '../ui/IAChat.jsx';
import { useRol } from '../../hooks/useRol.js';

export default function Layout() {
  const { esAlumno } = useRol();

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* El chat de IA está disponible para todos los roles de seguimiento académico */}
      {!esAlumno && <IAChat />}
    </div>
  );
}
