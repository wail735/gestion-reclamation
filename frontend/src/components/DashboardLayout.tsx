import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSocket } from '../hooks/useSocket';

const DashboardLayout = () => {
  useSocket();
  return (
    <div className="min-h-screen bg-brand-darkBg bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-darkBg via-brand-darkBg to-brand-card/50 text-brand-text font-sans flex overflow-hidden selection:bg-brand-green/30 selection:text-white">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar />
        <main className="flex-1 p-4 lg:p-8 overflow-auto focus:outline-none no-scrollbar pb-24 lg:ml-[280px]">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
