'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  GraduationCap, 
  ClipboardList, 
  ShieldCheck, 
  LogOut, 
  Bell, 
  User as UserIcon,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll notifications every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getLinks = () => {
    const links = [];
    if (user.role === 'ADMIN') {
      links.push({
        label: 'Admin Control Center',
        href: '/admin',
        icon: ShieldCheck
      });
    } else {
      links.push(
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { 
          label: user.profile?.researchGroupId === 'GROUP_A' ? 'Digital Study Planner' : 'Manual Study Logs', 
          href: '/planner', 
          icon: Calendar 
        },
        { label: 'Study Sessions', href: '/sessions', icon: Clock },
        { label: 'Academic Performance', href: '/performance', icon: GraduationCap },
        { label: 'Weekly Surveys', href: '/surveys', icon: ClipboardList }
      );
    }
    return links;
  };

  const menuLinks = getLinks();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-5 select-none no-print">
      {/* Header logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20">
          SP
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            STUDYPLANNER
          </h1>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Research Portal</span>
        </div>
      </div>

      {/* User Badge Card */}
      <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
          {user.profile?.name ? user.profile.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm truncate">{user.profile?.name || 'Administrator'}</p>
          <span className="text-[11px] font-semibold text-slate-400">
            {user.role === 'ADMIN' ? 'Researcher Admin' : (
              user.profile?.researchGroupId === 'GROUP_A' 
                ? 'Group A: Digital Planner' 
                : user.profile?.researchGroupId === 'GROUP_B'
                  ? 'Group B: Manual Planning'
                  : 'Group Awaiting Assignment'
            )}
          </span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {menuLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notifications Drawer Switch & Logout */}
      <div className="mt-auto space-y-2 border-t border-slate-800 pt-4">
        {user.role !== 'ADMIN' && (
          <button
            onClick={() => setShowNotifDrawer(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile top navigation */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-3 sticky top-0 z-50 shadow-md border-b border-slate-800 no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 text-slate-400 hover:text-slate-100">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            STUDYPLANNER
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user.role !== 'ADMIN' && (
            <button onClick={() => setShowNotifDrawer(true)} className="relative p-1 text-slate-400 hover:text-white">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}
            </button>
          )}
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Mobile menu modal overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex no-print">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)}></div>
          <div className="relative w-64 max-w-xs bg-slate-900 h-full flex flex-col z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifDrawer(false)}></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="text-blue-500" />
                <h2 className="font-extrabold text-lg text-slate-950 dark:text-slate-50">Notifications</h2>
              </div>
              <button 
                onClick={() => setShowNotifDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="w-full text-right text-xs text-blue-600 dark:text-blue-400 hover:underline mb-4 font-bold"
              >
                Mark all as read
              </button>
            )}

            <div className="flex-1 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle size={32} className="mb-2 text-slate-300" />
                  <p className="text-sm">You are all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      notif.isRead 
                        ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800' 
                        : 'bg-blue-500/5 border-blue-500/10 dark:bg-blue-500/5 dark:border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{notif.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-2">
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
