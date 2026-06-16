'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Clock, BookOpen, CheckCircle, TrendingUp, AlertCircle, Sparkles, Printer, X, GraduationCap, Award } from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [hoursSummary, setHoursSummary] = useState({ dailyHours: 0, weeklyHours: 0, monthlyHours: 0, totalHours: 0 });
  const [performanceSummary, setPerformanceSummary] = useState({ averageGradePercent: 0, averageGPA: 0, improvementPercentage: 0, trends: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [manualLogs, setManualLogs] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Report card modal state
  const [showReportCard, setShowReportCard] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user && token) {
      fetchDashboardData();
    }
  }, [user, loading, token, router]);

  const fetchDashboardData = async () => {
    setDbLoading(true);
    try {
      // Fetch hours summary
      const hoursRes = await fetch(`${API_BASE}/sessions/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hoursRes.ok) {
        const data = await hoursRes.json();
        setHoursSummary(data);
      }

      // Fetch performance summary
      const perfRes = await fetch(`${API_BASE}/performance/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformanceSummary(data);
      }

      // Fetch AI recommendations
      const recRes = await fetch(`${API_BASE}/ai/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (recRes.ok) {
        const data = await recRes.json();
        setRecommendations(data.recommendations);
      }

      // Fetch tasks / manual logs depending on cohort
      if (user.profile?.researchGroupId === 'GROUP_A') {
        const taskRes = await fetch(`${API_BASE}/planner/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (taskRes.ok) {
          const data = await taskRes.json();
          setTasks(data.tasks);
        }
      } else if (user.profile?.researchGroupId === 'GROUP_B') {
        const logRes = await fetch(`${API_BASE}/planner/manual`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logRes.ok) {
          const data = await logRes.json();
          setManualLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDbLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Awaiting group assignment view
  if (!user.profile?.researchGroupId) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50">Awaiting Cohort Assignment</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Thank you for completing your profile! A Research Administrator is reviewing your details and will assign you to either <strong>Group A (Digital Study Planner)</strong> or <strong>Group B (Manual Planning)</strong> shortly.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border dark:border-slate-800 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Next steps</span>
              <p className="text-xs text-slate-500">You will receive a notification in this app once assignment is complete. In the meantime, you can explore other menu options once assigned.</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
            >
              Refresh Status
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate Task Completion Rate
  let taskCompletionRate = 0;
  let completedCount = 0;
  let pendingCount = 0;

  if (user.profile.researchGroupId === 'GROUP_A') {
    completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    pendingCount = tasks.length - completedCount;
    taskCompletionRate = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  } else if (user.profile.researchGroupId === 'GROUP_B') {
    const totalPlanned = manualLogs.reduce((sum, log) => sum + log.tasksPlanned, 0);
    completedCount = manualLogs.reduce((sum, log) => sum + log.tasksCompleted, 0);
    pendingCount = Math.max(0, totalPlanned - completedCount);
    taskCompletionRate = totalPlanned > 0 ? (completedCount / totalPlanned) * 100 : 0;
  }

  // Recharts Pie Data for Task Completion
  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'Pending', value: pendingCount }
  ];
  const COLORS = ['#2563eb', '#c084fc']; // Blue, Light Purple

  // Safe subjectHours aggregation
  const mockSubjectHours = { 'Mathematics': 8.5, 'Computer Science': 12.0, 'Physics': 6.0, 'Chemistry': 4.5 };
  const barData = Object.entries(mockSubjectHours).map(([subject, hours]) => ({ subject, hours }));

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Top welcome */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
              Welcome back, {user.profile.name}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Cohorts research view: <strong className="text-blue-600 dark:text-blue-400">{user.profile.researchGroup?.name}</strong>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportCard(true)}
              className="px-4 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-750 text-white text-xs flex items-center gap-2 shadow-md shadow-purple-500/15 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Academic Report Card</span>
            </button>
            <div className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-slate-400">Study status: </span>
              <span className="font-bold text-emerald-500">Active</span>
            </div>
          </div>
        </div>

        {/* Dynamic printer notification header (only printed, hidden in browser) */}
        <div className="hidden print-only space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-black">StudyPlanner Research - Academic Progress Report Card</h1>
              <p className="text-xs text-slate-500">Evaluating cognitive time management methods on academic performance.</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Student: {user.profile.name}</p>
              <p>Group: {user.profile.researchGroup?.name}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Hours */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Study Hours</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Clock size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {hoursSummary.weeklyHours.toFixed(1)} hrs
              </p>
              <span className="text-xs text-slate-500">{hoursSummary.dailyHours.toFixed(1)} logged today</span>
            </div>
          </div>

          {/* Card 2: GPA */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic GPA</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center"><BookOpen size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {performanceSummary.averageGPA.toFixed(2)}
              </p>
              <span className="text-xs text-slate-500">Scale of 4.0</span>
            </div>
          </div>

          {/* Card 3: Completion */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Task Completion</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {taskCompletionRate.toFixed(1)}%
              </p>
              <span className="text-xs text-slate-500">{completedCount} tasks completed</span>
            </div>
          </div>

          {/* Card 4: Trend */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Improvement Rate</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><TrendingUp size={16} /></div>
            </div>
            <div>
              <p className={`text-3xl font-extrabold ${performanceSummary.improvementPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {performanceSummary.improvementPercentage >= 0 ? '+' : ''}
                {performanceSummary.improvementPercentage.toFixed(1)}%
              </p>
              <span className="text-xs text-slate-500">Compared to initial grades</span>
            </div>
          </div>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GPA Trendline (Line Chart) */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Academic GPA & Scores Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceSummary.trends.filter(r => r.type === 'GPA')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 4]} stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" name="GPA (4.0 Scale)" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Completion (Pie Chart) */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Task Distribution</h3>
            <div className="h-56 flex justify-center items-center relative">
              {completedCount === 0 && pendingCount === 0 ? (
                <div className="text-slate-400 text-xs">No tasks logged yet. Create tasks in the planner page!</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {tasks.length > 0 && (
              <div className="text-center text-xs text-slate-500">
                Total logged tasks: {tasks.length}
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations & study details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Recommendations Panel */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4 bg-slate-900/5 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500 dark:text-blue-400 animate-pulse-subtle" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Study Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`p-4 rounded-xl border flex items-start gap-4 transition ${
                    rec.priority === 'CRITICAL' 
                      ? 'bg-red-500/5 border-red-500/10 text-slate-900 dark:text-slate-100' 
                      : rec.priority === 'HIGH'
                        ? 'bg-amber-500/5 border-amber-500/10'
                        : 'bg-blue-500/5 border-blue-500/10'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                        {rec.category}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        rec.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                        rec.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{rec.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Profile Details card */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Participant Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b dark:border-slate-850 pb-2">
                <span className="text-slate-400">Institution</span>
                <span className="font-bold">{user.profile.institution}</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-850 pb-2">
                <span className="text-slate-400">Department</span>
                <span className="font-bold">{user.profile.department}</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-850 pb-2">
                <span className="text-slate-400">Semester</span>
                <span className="font-bold">{user.profile.semester}</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-850 pb-2">
                <span className="text-slate-400">Age / Gender</span>
                <span className="font-bold">{user.profile.age} / {user.profile.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contact</span>
                <span className="font-bold">{user.profile.contactInfo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRINTABLE REPORT CARD MODAL OVERLAY */}
        {showReportCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 no-print">
            <div className="bg-white text-slate-900 border border-slate-200 p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
              
              {/* Report Header toolbar inside modal */}
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Award className="text-purple-600" />
                  <h2 className="font-black text-lg text-slate-900">Weekly Progress Report Card</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Printer size={13} />
                    <span>Print Card</span>
                  </button>
                  <button 
                    onClick={() => setShowReportCard(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div className="space-y-6 flex-1 text-slate-900">
                {/* School Profile Grid */}
                <div className="p-4 bg-slate-50 rounded-2xl border grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 uppercase font-extrabold text-[9px]">Student Name</p>
                    <p className="font-bold text-slate-950 text-sm mt-0.5">{user.profile.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-extrabold text-[9px]">Institution</p>
                    <p className="font-bold mt-0.5">{user.profile.institution}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-extrabold text-[9px]">Study Cohort Group</p>
                    <p className="font-bold text-blue-600 mt-0.5">{user.profile.researchGroup?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-extrabold text-[9px]">Department / Semester</p>
                    <p className="font-bold mt-0.5">{user.profile.department} ({user.profile.semester})</p>
                  </div>
                </div>

                {/* Score Grid Cards */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-2xl space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Average GPA</p>
                    <p className="text-xl font-black text-slate-950">{performanceSummary.averageGPA.toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-2xl space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Assessment Avg</p>
                    <p className="text-xl font-black text-slate-950">{performanceSummary.averageGradePercent.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 border rounded-2xl space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Task Completion</p>
                    <p className="text-xl font-black text-slate-950">{taskCompletionRate.toFixed(0)}%</p>
                  </div>
                </div>

                {/* Study Sessions Summary */}
                <div className="space-y-2.5">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-wide">Study Log Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 border rounded-xl">
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-400">Total Study Hours Logged</span>
                      <span className="font-bold">{hoursSummary.totalHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-400">Weekly Logged Hours</span>
                      <span className="font-bold">{hoursSummary.weeklyHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Average Hours</span>
                      <span className="font-bold">{(hoursSummary.weeklyHours / 7).toFixed(1)} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Improvement Rate</span>
                      <span className="font-bold text-emerald-500">+{performanceSummary.improvementPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-wide">AI Strategy Recommendations</h4>
                  <div className="space-y-2">
                    {recommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                        <p className="font-bold text-blue-800">{rec.title} ({rec.priority} Priority)</p>
                        <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Printable footer */}
              <div className="border-t pt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-6">
                StudyPlanner cognitive study cohort program © 2026. certified transcript record.
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
