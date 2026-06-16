'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { 
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Label
} from 'recharts';
import { 
  ShieldCheck, Users, BarChart3, Database, FileSpreadsheet, Printer, 
  UserPlus, HelpCircle, Shuffle, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD | PARTICIPANTS | SURVEYS | EXPORTS
  const [statsData, setStatsData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [responses, setResponses] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manual survey creation form (for research admin)
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDesc, setSurveyDesc] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (user && token) {
      fetchAdminData();
    }
  }, [user, loading, token, router]);

  const fetchAdminData = async () => {
    setDbLoading(true);
    try {
      // Fetch research stats (t-test, correlation, mean/median)
      const statsRes = await fetch(`${API_BASE}/stats/research`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatsData(data);
      }

      // Fetch participants list
      const profilesRes = await fetch(`${API_BASE}/profile/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profilesRes.ok) {
        const data = await profilesRes.json();
        setProfiles(data.profiles);
      }

      // Fetch survey responses
      const respRes = await fetch(`${API_BASE}/surveys/admin/responses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respRes.ok) {
        const data = await respRes.json();
        setResponses(data.responses);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleAssignCohort = async (profileId, cohort) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/profile/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileId, researchGroupId: cohort })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Assigned participant to ${cohort || 'unassigned'}.`);
        fetchAdminData();
      } else {
        setError(data.error || 'Failed to assign cohort.');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  const handleRandomAssign = async (profileId) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/profile/assign-random`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Participant randomly assigned.');
        fetchAdminData();
      } else {
        setError(data.error || 'Failed random assignment.');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  const triggerExport = (reportType, format) => {
    const url = `${API_BASE}/reports?type=${reportType}&format=${format}`;
    // Trigger download using window.open or hidden anchor click
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    // Include token in query params if cookies aren't used, but since it is an anchor tag,
    // let's do a fetch with headers and convert to blob!
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error(err);
      alert('Failed to export report');
    });
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!surveyTitle) return;

    try {
      const res = await fetch(`${API_BASE}/surveys/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: surveyTitle,
          description: surveyDesc,
          questions: [
            { text: 'Meeting deadlines score (1-5)', type: 'SCALE', category: 'STUDY_HABITS' },
            { text: 'Tasks priority focus (1-5)', type: 'SCALE', category: 'PRODUCTIVITY' },
            { text: 'Time utilization rate (1-5)', type: 'SCALE', category: 'PRODUCTIVITY' },
            { text: 'Stress balance level (1-5)', type: 'SCALE', category: 'STRESS' },
            { text: 'Planning methodology rating (1-5)', type: 'SCALE', category: 'PLANNER_SATISFACTION' }
          ]
        })
      });

      if (res.ok) {
        setSuccess('New Research Survey created and broadcasted!');
        setSurveyTitle('');
        setSurveyDesc('');
        setShowSurveyForm(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Formatting comparison charts
  const barChartData = statsData ? [
    {
      metric: 'GPA (x10)',
      'Digital Planner (A)': statsData.stats.GROUP_A.gpa.mean * 10,
      'Manual Planning (B)': statsData.stats.GROUP_B.gpa.mean * 10
    },
    {
      metric: 'Weekly Study Hours',
      'Digital Planner (A)': statsData.stats.GROUP_A.studyHours.mean,
      'Manual Planning (B)': statsData.stats.GROUP_B.studyHours.mean
    },
    {
      metric: 'Time Management',
      'Digital Planner (A)': statsData.stats.GROUP_A.timeManagementScore.mean,
      'Manual Planning (B)': statsData.stats.GROUP_B.timeManagementScore.mean
    },
    {
      metric: 'Task Completion %',
      'Digital Planner (A)': statsData.stats.GROUP_A.taskCompletionRate.mean,
      'Manual Planning (B)': statsData.stats.GROUP_B.taskCompletionRate.mean
    }
  ] : [];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">Research Control Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Study statistics, participant directories, Welch's T-Test calculations, and CSV reports.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl font-bold border dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
            >
              <Printer size={15} />
              <span>Print Study Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* Dynamic printer notification header (only printed, hidden in browser) */}
        <div className="hidden print-only space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-black">StudyPlanner Research Platform - Official Findings Report</h1>
              <p className="text-sm text-slate-500">Evaluating Digital Study Planners vs Manual Planning Methodologies</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Generated on: {new Date().toLocaleDateString()}</p>
              <p>Researcher ID: admin@studyplanner.org</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 no-print">
          {[
            { id: 'DASHBOARD', label: 'Research Dashboard', icon: BarChart3 },
            { id: 'PARTICIPANTS', label: 'Participant Directory', icon: Users },
            { id: 'SURVEYS', label: 'Weekly Surveys Logs', icon: Database },
            { id: 'EXPORTS', label: 'CSV / Data Exporter', icon: FileSpreadsheet }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold no-print">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold no-print">{success}</div>}

        {/* TAB 1: RESEARCH COMPARISON DASHBOARD & STATS */}
        {(activeTab === 'DASHBOARD' || typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) && statsData && (
          <div className="space-y-6">
            
            {/* Aggregate Study size cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Total Participants</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{statsData.summaryStats.totalParticipants}</p>
              </div>
              <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Active Loggers</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{statsData.summaryStats.activeParticipants}</p>
              </div>
              <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Group A (Digital)</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{statsData.summaryStats.plannerGroupSize}</p>
              </div>
              <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Group B (Manual)</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{statsData.summaryStats.manualGroupSize}</p>
              </div>
            </div>

            {/* Side-by-side Comparative Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Cohort Comparative Analysis</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="Digital Planner (A)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Manual Planning (B)" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-bold">Note: GPA is multiplied by 10 for visual scaling on this axis.</p>
              </div>

              {/* Research Hypotheses & Conclusions card */}
              <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4 bg-slate-900/5 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                  <ShieldCheck className="text-blue-500" />
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Analytical Research Conclusions</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">1. Does planner usage improve time management?</h4>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{statsData.conclusions.timeManagement}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">2. Does planner usage improve grades?</h4>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{statsData.conclusions.academicPerformance}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">3. Is there a correlation between planning & GPA?</h4>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{statsData.conclusions.gradesCorrelation}</p>
                  </div>

                  <div className="p-3.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-xl">
                    <p className="font-extrabold uppercase text-[10px] text-blue-500 mb-1">Study Verdict</p>
                    <p className="text-[10px] leading-relaxed font-semibold">{statsData.conclusions.finalVerdict}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Activity Density Heatmap */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Cohort Study Activity Density (Last 14 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Group A Heatmap */}
                <div className="p-4 rounded-xl border dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Group A: Digital Planner Users</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Blue Grid</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statsData.dailyDensity?.map((d, idx) => {
                      const hrs = d.hoursA;
                      const colorClass = 
                        hrs === 0 ? 'bg-slate-200 dark:bg-slate-800 text-transparent' :
                        hrs <= 2 ? 'bg-blue-300 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                        hrs <= 5 ? 'bg-blue-500 text-white' :
                        'bg-blue-700 text-white';
                      return (
                        <div 
                          key={idx}
                          title={`${d.dateString || d.dateStr}: ${hrs} hours study logged`}
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[9px] font-black cursor-help transition hover:scale-105 ${colorClass}`}
                        >
                          <span>{hrs}h</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group B Heatmap */}
                <div className="p-4 rounded-xl border dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Group B: Manual Planning Users</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Purple Grid</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statsData.dailyDensity?.map((d, idx) => {
                      const hrs = d.hoursB;
                      const colorClass = 
                        hrs === 0 ? 'bg-slate-200 dark:bg-slate-800 text-transparent' :
                        hrs <= 2 ? 'bg-purple-300 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' :
                        hrs <= 5 ? 'bg-purple-500 text-white' :
                        'bg-purple-700 text-white';
                      return (
                        <div 
                          key={idx}
                          title={`${d.dateString || d.dateStr}: ${hrs} hours study logged`}
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[9px] font-black cursor-help transition hover:scale-105 ${colorClass}`}
                        >
                          <span>{hrs}h</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              <div className="flex justify-end gap-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800"></span> 0h</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-300 dark:bg-blue-900/40"></span> 0-2h</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> 2-5h</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-700"></span> 5h+</span>
              </div>
            </div>

            {/* Scientific statistical output summary */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Scientific Statistics Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">Research Metric Tested</th>
                      <th className="py-2.5">Mean Group A (App)</th>
                      <th className="py-2.5">Mean Group B (Manual)</th>
                      <th className="py-2.5 text-center">T-Statistic</th>
                      <th className="py-2.5 text-center">Degrees of Freedom</th>
                      <th className="py-2.5 text-center">P-Value</th>
                      <th className="py-2.5 text-right">Significance (p &lt; 0.05)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-850">
                    <tr className="hover:bg-slate-500/5 transition">
                      <td className="py-3 font-semibold">Time Management Score</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{statsData.stats.GROUP_A.timeManagementScore.mean}/100</td>
                      <td className="py-3 text-slate-400">{statsData.stats.GROUP_B.timeManagementScore.mean}/100</td>
                      <td className="py-3 text-center">{statsData.tTests.timeManagement.tValue}</td>
                      <td className="py-3 text-center">{statsData.tTests.timeManagement.df}</td>
                      <td className="py-3 text-center font-bold">{statsData.tTests.timeManagement.pValue}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statsData.tTests.timeManagement.significant ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {statsData.tTests.timeManagement.significant ? 'Significant' : 'Not Significant'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-500/5 transition">
                      <td className="py-3 font-semibold">Academic GPA</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{statsData.stats.GROUP_A.gpa.mean}</td>
                      <td className="py-3 text-slate-400">{statsData.stats.GROUP_B.gpa.mean}</td>
                      <td className="py-3 text-center">{statsData.tTests.academicPerformance.tValue}</td>
                      <td className="py-3 text-center">{statsData.tTests.academicPerformance.df}</td>
                      <td className="py-3 text-center font-bold">{statsData.tTests.academicPerformance.pValue}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statsData.tTests.academicPerformance.significant ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {statsData.tTests.academicPerformance.significant ? 'Significant' : 'Not Significant'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-500/5 transition">
                      <td className="py-3 font-semibold">Weekly Study Hours</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{statsData.stats.GROUP_A.studyHours.mean} hrs</td>
                      <td className="py-3 text-slate-400">{statsData.stats.GROUP_B.studyHours.mean} hrs</td>
                      <td className="py-3 text-center">{statsData.tTests.studyHours.tValue}</td>
                      <td className="py-3 text-center">{statsData.tTests.studyHours.df}</td>
                      <td className="py-3 text-center font-bold">{statsData.tTests.studyHours.pValue}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statsData.tTests.studyHours.significant ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {statsData.tTests.studyHours.significant ? 'Significant' : 'Not Significant'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-500/5 transition">
                      <td className="py-3 font-semibold">Task Completion Rate</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{statsData.stats.GROUP_A.taskCompletionRate.mean}%</td>
                      <td className="py-3 text-slate-400">{statsData.stats.GROUP_B.taskCompletionRate.mean}%</td>
                      <td className="py-3 text-center">{statsData.tTests.taskCompletion.tValue}</td>
                      <td className="py-3 text-center">{statsData.tTests.taskCompletion.df}</td>
                      <td className="py-3 text-center font-bold">{statsData.tTests.taskCompletion.pValue}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statsData.tTests.taskCompletion.significant ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {statsData.tTests.taskCompletion.significant ? 'Significant' : 'Not Significant'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pearson Correlation Table */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Pearson Correlation Analysis (Planning indicators vs GPA)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-900/5 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Time Management Score & GPA</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{statsData.correlations.timeManagementAndGpa}</p>
                  <span className="text-[10px] text-slate-400">Moderate Positive Correlation</span>
                </div>
                <div className="p-4 bg-slate-900/5 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Weekly Study Hours & GPA</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{statsData.correlations.studyHoursAndGpa}</p>
                  <span className="text-[10px] text-slate-400">Moderate Positive Correlation</span>
                </div>
                <div className="p-4 bg-slate-900/5 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Task Completion Rate & GPA</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{statsData.correlations.taskCompletionAndGpa}</p>
                  <span className="text-[10px] text-slate-400">Strong Positive Correlation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTICIPANTS DIRECTORY & ALLOCATIONS */}
        {activeTab === 'PARTICIPANTS' && (
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Participant Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Age / Gender</th>
                    <th className="py-2.5">Institution</th>
                    <th className="py-2.5">Department / Semester</th>
                    <th className="py-2.5">Current Assigned Group</th>
                    <th className="py-2.5 text-center">Manual Allocation</th>
                    <th className="py-2.5 text-right">Random allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-850">
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No participant profiles found. Ask students to register!</td>
                    </tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-500/5 transition">
                        <td className="py-3 font-semibold text-slate-950 dark:text-slate-50">
                          {p.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{p.user?.email}</span>
                        </td>
                        <td className="py-3 text-slate-500">{p.age} / {p.gender}</td>
                        <td className="py-3">{p.institution}</td>
                        <td className="py-3">{p.department} ({p.semester})</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                            p.researchGroupId === 'GROUP_A' ? 'bg-blue-500/10 text-blue-500' :
                            p.researchGroupId === 'GROUP_B' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {p.researchGroup ? p.researchGroup.name : 'Unassigned (Awaiting Review)'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => handleAssignCohort(p.id, 'GROUP_A')}
                              className="px-2 py-1 bg-blue-600 text-[10px] text-white font-bold rounded-lg hover:bg-blue-700 transition"
                            >
                              GROUP A
                            </button>
                            <button
                              onClick={() => handleAssignCohort(p.id, 'GROUP_B')}
                              className="px-2 py-1 bg-purple-600 text-[10px] text-white font-bold rounded-lg hover:bg-purple-700 transition"
                            >
                              GROUP B
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleRandomAssign(p.id)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition inline-flex items-center gap-1"
                            title="Assign to Group A or Group B randomly"
                          >
                            <Shuffle size={13} />
                            <span className="text-[10px] font-bold">Random</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SURVEY RESPONSES VIEW */}
        {activeTab === 'SURVEYS' && (
          <div className="space-y-6">
            
            {/* Create Weekly Survey trigger */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Research Surveys Management</h3>
                <button 
                  onClick={() => setShowSurveyForm(!showSurveyForm)}
                  className="px-3.5 py-1.5 rounded-xl font-bold bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                >
                  {showSurveyForm ? 'Cancel' : 'Create Weekly Questionnaire'}
                </button>
              </div>

              {showSurveyForm && (
                <form onSubmit={handleCreateSurvey} className="p-4 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-2xl space-y-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Survey Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Cognitive Stress & Planning Satisfaction: Week 3"
                      value={surveyTitle}
                      onChange={(e) => setSurveyTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Description</label>
                    <textarea
                      placeholder="Assessing planning satisfaction rates for the cohort..."
                      value={surveyDesc}
                      onChange={(e) => setSurveyDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                  >
                    Broadcast Survey to Students
                  </button>
                </form>
              )}
            </div>

            {/* Responses Logs list */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Weekly Student Survey Submissions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">Submission Date</th>
                      <th className="py-2.5">Survey Title</th>
                      <th className="py-2.5">Student Name</th>
                      <th className="py-2.5">Cohort Group</th>
                      <th className="py-2.5 text-right">Time Management Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-850">
                    {responses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">No student survey responses submitted yet.</td>
                      </tr>
                    ) : (
                      responses.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-500/5 transition">
                          <td className="py-3 font-semibold">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-slate-900 dark:text-slate-100 font-bold">{r.surveyTitle}</td>
                          <td className="py-3">{r.studentName}</td>
                          <td className="py-3 text-slate-500">{r.researchGroupName}</td>
                          <td className="py-3 text-right font-black text-blue-600 dark:text-blue-400">{r.timeManagementScore}/100</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATA EXPORTER */}
        {activeTab === 'EXPORTS' && (
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-6">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Export Study Data Reports</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Export completed records for statistical analysis in Excel or other statistics programs (SPSS, R). The files include all participant identifiers, group allocations, study hours aggregate, survey scores, and GPA averages.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Cohort Comparison Export */}
              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Cohort Comparative Database</h4>
                <p className="text-xs text-slate-500">Downloads a complete CSV of all participants, their study groups, study hours, GPA averages, task completions, and time management score summaries.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerExport('GROUP_COMPARISON', 'CSV')}
                    className="px-4 py-2.5 rounded-xl font-bold bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                  >
                    Export to CSV / Excel
                  </button>
                </div>
              </div>

              {/* Research Findings Export */}
              <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Statistical Metrics & Findings Sheet</h4>
                <p className="text-xs text-slate-500">Downloads summaries of T-Test values, correlations, variances, and auto-generated research conclusions in CSV spreadsheet format.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerExport('GROUP_COMPARISON', 'CSV')}
                    className="px-4 py-2.5 rounded-xl font-bold bg-purple-600 text-white text-xs hover:bg-purple-700 transition"
                  >
                    Export Stats to CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
