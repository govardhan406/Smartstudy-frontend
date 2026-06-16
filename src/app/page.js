'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  BarChart3, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if logged in already
  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/10">
              SP
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                StudyPlanner
              </span>
              <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest leading-none">Research Hub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/auth?tab=login" 
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?tab=register" 
              className="px-4 py-2 text-sm font-bold text-white rounded-xl gradient-btn shadow-md shadow-blue-500/15"
            >
              Join the Study
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-6">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 uppercase">
            Active Academic Research Study
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
            Do Digital Planners <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Improve Study Performance?
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            Welcome to the StudyPlanner Research Platform. We are evaluating time management efficiency and academic outcomes by comparing digital study planning software against traditional manual tracking systems. Join our cohort today to analyze your own habits while contributing to cognitive research.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link 
              href="/auth?tab=register" 
              className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
            >
              Register as Participant
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link 
              href="/auth?tab=login" 
              className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-center"
            >
              Access Admin Console
            </Link>
          </div>
        </div>

        {/* Visual Comparison Card */}
        <div className="relative p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-6">
          <h3 className="font-extrabold text-lg text-slate-950 dark:text-slate-50">Experimental Design: Dual Cohort Study</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Group A */}
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Calendar size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Group A: Digital Planner</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Utilize our rich built-in interactive study calendar, track priority tasks, set hours, and receive alerts.
              </p>
            </div>
            {/* Group B */}
            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Group B: Manual Planning</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Maintain your traditional paper notebooks or files and log daily hours manually in our researcher console.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-slate-800 grid grid-cols-3 text-center gap-2">
            <div>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">10+</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Participants</span>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">2</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Study Cohorts</span>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">95%</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data Capture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/40 border-t border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800 space-y-4">
            <div className="text-blue-500"><BookOpen size={24} /></div>
            <h4 className="font-extrabold text-base">Academic Gradebooks</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Log quizzes, midterm marks, final exams, and GPAs to trace improvement rates.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800 space-y-4">
            <div className="text-purple-500"><ClipboardCheck size={24} /></div>
            <h4 className="font-extrabold text-base">Time Management Score</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Take weekly survey assessments to generate organization and stress indices.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800 space-y-4">
            <div className="text-indigo-500"><Users size={24} /></div>
            <h4 className="font-extrabold text-base">Welch's T-Test Stats</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Admin dashboard performs statistical tests to calculate mean GPAs and significance values.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800 space-y-4">
            <div className="text-pink-500"><BarChart3 size={24} /></div>
            <h4 className="font-extrabold text-base">AI Recommendation</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Receive custom scheduling templates and productivity advice based on your logs.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
        <p>© 2026 StudyPlanner Research Platform. Built for academic cognitive behavior assessment.</p>
      </footer>
    </div>
  );
}
