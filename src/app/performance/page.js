'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, GraduationCap, TrendingUp, Award, AwardIcon } from 'lucide-react';

export default function PerformancePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ averageGradePercent: 0, averageGPA: 0, improvementPercentage: 0, trends: [] });
  const [dbLoading, setDbLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [type, setType] = useState('QUIZ'); // QUIZ | ASSIGNMENT | MIDTERM | FINAL | GPA
  const [subject, setSubject] = useState('');
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [gpaValue, setGpaValue] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && token) {
      fetchPerformanceData();
    }
  }, [user, loading, token, router]);

  const fetchPerformanceData = async () => {
    setDbLoading(true);
    try {
      const recRes = await fetch(`${API_BASE}/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (recRes.ok) {
        const data = await recRes.json();
        setRecords(data.records);
      }

      const sumRes = await fetch(`${API_BASE}/performance/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!type || !name || !date) {
      setError('Type, assessment name, and date are required.');
      return;
    }

    if (type === 'GPA' && gpaValue === '') {
      setError('GPA Value is required.');
      return;
    }

    if (type !== 'GPA' && (score === '' || maxScore === '')) {
      setError('Score and max possible score are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          subject: type === 'GPA' ? 'N/A' : subject,
          name,
          score: type === 'GPA' ? parseFloat(gpaValue) : parseFloat(score),
          maxScore: type === 'GPA' ? 4.0 : parseFloat(maxScore),
          gpaValue: type === 'GPA' ? parseFloat(gpaValue) : null,
          date
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Academic performance record logged.');
        setSubject('');
        setName('');
        setScore('');
        setGpaValue('');
        setDate('');
        fetchPerformanceData();
      } else {
        setError(data.error || 'Failed to add record.');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this academic record?')) return;
    try {
      const res = await fetch(`${API_BASE}/performance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPerformanceData();
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

  // Filter trends data for graphing
  const chartData = summary.trends.map(t => ({
    name: t.name,
    percent: t.percent,
    gpa: t.gpaValue,
    date: new Date(t.date).toLocaleDateString()
  }));

  const gpaData = chartData.filter(d => d.gpa !== null);
  const gradeData = chartData.filter(d => d.gpa === null);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">Academic Performance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Track your GPA changes, exam marks, and academic improvement rate over time.</p>
        </div>

        {/* Aggregated GPA and Grade averages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><GraduationCap size={24} /></div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Average GPA</span>
              <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{summary.averageGPA.toFixed(2)}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><Award size={24} /></div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Average Assessment Grade</span>
              <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{summary.averageGradePercent.toFixed(1)}%</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><TrendingUp size={24} /></div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Improvement Velocity</span>
              <p className={`text-2xl font-extrabold ${summary.improvementPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {summary.improvementPercentage >= 0 ? '+' : ''}{summary.improvementPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold">{success}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Trend graph and records list */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* GPA / Grade line charts */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Grade Trend Analytics</h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#2563eb" fontSize={11} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#2563eb' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#7c3aed" fontSize={11} label={{ value: 'GPA', angle: 90, position: 'insideRight', fill: '#7c3aed' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="percent" name="Grade Percentage" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="gpa" name="GPA Score" stroke="#7c3aed" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List table */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Academic Records Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Subject</th>
                      <th className="py-2.5">Assessment Name</th>
                      <th className="py-2.5 text-right">Achieved Score</th>
                      <th className="py-2.5 text-right">Max Scale</th>
                      <th className="py-2.5 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">No academic records logged yet. Enter one using the form on the right!</td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-500/5 transition">
                          <td className="py-3 font-semibold">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              r.type === 'GPA' ? 'bg-purple-500/10 text-purple-500' :
                              r.type === 'FINAL' ? 'bg-red-500/10 text-red-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="py-3 font-bold">{r.subject}</td>
                          <td className="py-3 text-slate-900 dark:text-slate-100">{r.name}</td>
                          <td className="py-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                            {r.type === 'GPA' ? r.score.toFixed(2) : r.score}
                          </td>
                          <td className="py-3 text-right text-slate-500">{r.type === 'GPA' ? '4.0' : r.maxScore}</td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteRecord(r.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form add record */}
          <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
              <Plus className="text-blue-500" />
              <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Log Assessment Mark</h3>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase">Assessment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="QUIZ">Quiz / Short Test</option>
                  <option value="ASSIGNMENT">Assignment / Project</option>
                  <option value="MIDTERM">Midterm Exam</option>
                  <option value="FINAL">Final Exam</option>
                  <option value="GPA">Semester GPA / CGPA</option>
                </select>
              </div>

              {type !== 'GPA' && (
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase">Subject / Course</label>
                  <input
                    type="text"
                    required
                    placeholder="Data Structures"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase">Assessment Name</label>
                <input
                  type="text"
                  required
                  placeholder={type === 'GPA' ? 'Semester 2 GPA' : 'Lab Homework 3'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {type === 'GPA' ? (
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase">GPA Achieved (4.0 Scale)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    required
                    placeholder="3.75"
                    value={gpaValue}
                    onChange={(e) => setGpaValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Score Achieved</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="85"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Max Possible</label>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase">Assessment Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 transition"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
