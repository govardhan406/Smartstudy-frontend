'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { Clock, Plus, Trash2, Calendar, BookOpen, Play, Pause, RotateCcw, SkipForward, Award } from 'lucide-react';

export default function StudySessionsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [hoursSummary, setHoursSummary] = useState({ dailyHours: 0, weeklyHours: 0, monthlyHours: 0, totalHours: 0 });
  const [dbLoading, setDbLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state (manual)
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [productivityRating, setProductivityRating] = useState(5);
  const [notes, setNotes] = useState('');

  // Pomodoro Timer State
  const [pomoTime, setPomoTime] = useState(1500); // 25 mins = 1500s
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState('STUDY'); // STUDY | BREAK
  const [pomoSubject, setPomoSubject] = useState('General Focus');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && token) {
      fetchSessionsData();
    }
  }, [user, loading, token, router]);

  // Pomodoro timer tick loop
  useEffect(() => {
    let interval = null;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => {
        setPomoTime(prev => prev - 1);
      }, 1000);
    } else if (pomoActive && pomoTime === 0) {
      handlePomoComplete();
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime]);

  const fetchSessionsData = async () => {
    setDbLoading(true);
    try {
      const sesRes = await fetch(`${API_BASE}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sesRes.ok) {
        const data = await sesRes.json();
        setSessions(data.sessions);
      }

      const sumRes = await fetch(`${API_BASE}/sessions/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sumRes.ok) {
        const data = await sumRes.json();
        setHoursSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  const playSynthBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('AudioContext not allowed or supported by browser.');
    }
  };

  const handlePomoComplete = async () => {
    playSynthBeep();
    setPomoActive(false);

    if (pomoMode === 'STUDY') {
      setError('');
      setSuccess(`Focused Study Pomodoro Complete! Autologging session for "${pomoSubject}"...`);

      // Automatically construct and log study session (25 mins = 0.42 hours)
      const now = new Date();
      const formatTimeStr = (d) => d.toTimeString().split(' ')[0].substring(0, 5);
      const endStr = formatTimeStr(now);
      const startD = new Date(now.getTime() - 25 * 60 * 1000);
      const startStr = formatTimeStr(startD);
      const dateStr = now.toISOString().split('T')[0];

      try {
        const res = await fetch(`${API_BASE}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subject: pomoSubject,
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            productivityRating: 9, // Pomodoro is highly focused
            notes: 'Automated study log recorded via Pomodoro Focus Timer.'
          })
        });

        if (res.ok) {
          setSuccess(`Study session logged! Next up: Take a 5-minute break.`);
          setPomoMode('BREAK');
          setPomoTime(300); // 5 mins break
          fetchSessionsData();
        } else {
          setError('Failed to auto-log completed session.');
        }
      } catch (err) {
        setError('Error auto-logging session.');
      }
    } else {
      setSuccess('Break complete! Let\'s begin studying again.');
      setPomoMode('STUDY');
      setPomoTime(1500); // Reset study
    }
  };

  const handlePomoReset = () => {
    setPomoActive(false);
    setPomoTime(pomoMode === 'STUDY' ? 1500 : 300);
  };

  const handlePomoSkip = () => {
    handlePomoComplete();
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subject || !date || !startTime || !endTime || !productivityRating) {
      setError('Subject, date, start time, end time, and productivity rating are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          date,
          startTime,
          endTime,
          productivityRating: parseInt(productivityRating),
          notes
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Study session logged successfully.');
        setSubject('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setProductivityRating(5);
        setNotes('');
        fetchSessionsData();
      } else {
        setError(data.error || 'Failed to log study session.');
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm('Are you sure you want to delete this study session log?')) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSessionsData();
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

  // Format countdown string MM:SS
  const formattedPomoTime = `${Math.floor(pomoTime / 60)}:${(pomoTime % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">Study Sessions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Record and monitor your direct academic study times, durations, and focus levels.</p>
        </div>

        {/* Aggregate hours cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Daily Logged Hours</span>
            <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{hoursSummary.dailyHours.toFixed(1)} hrs</p>
          </div>
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Weekly Logged Hours</span>
            <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{hoursSummary.weeklyHours.toFixed(1)} hrs</p>
          </div>
          <div className="p-5 rounded-2xl glass-panel border dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Monthly Logged Hours</span>
            <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{hoursSummary.monthlyHours.toFixed(1)} hrs</p>
          </div>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold">{success}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Recent Sessions Table */}
          <div className="xl:col-span-2 p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Study Sessions History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Subject</th>
                    <th className="py-2.5">Time Frame</th>
                    <th className="py-2.5">Duration</th>
                    <th className="py-2.5 text-center">Productivity</th>
                    <th className="py-2.5">Notes</th>
                    <th className="py-2.5 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-850">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No study sessions logged yet. Submit a new session in the right panel.</td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-500/5 transition">
                        <td className="py-3 font-semibold">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{s.subject}</td>
                        <td className="py-3 text-slate-500">{s.startTime} - {s.endTime}</td>
                        <td className="py-3 font-semibold">{s.duration.toFixed(1)} hrs</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.productivityRating >= 8 ? 'bg-emerald-500/10 text-emerald-500' :
                            s.productivityRating >= 5 ? 'bg-blue-500/10 text-blue-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {s.productivityRating}/10
                          </span>
                        </td>
                        <td className="py-3 max-w-xs truncate text-slate-400" title={s.notes}>{s.notes || '-'}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDeleteSession(s.id)}
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

          {/* Right Forms Stack: Pomodoro + Manual Session */}
          <div className="space-y-6">
            
            {/* Pomodoro Timer Card */}
            <div className="p-6 rounded-2xl glass-panel border border-blue-500/20 bg-blue-500/5 dark:border-blue-500/15 space-y-4">
              <div className="flex justify-between items-center border-b border-blue-500/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-500" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Pomodoro Timer</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  pomoMode === 'STUDY' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {pomoMode} Mode
                </span>
              </div>

              <div className="text-center py-4 space-y-2">
                <p className="text-5xl font-black font-mono tracking-wider text-slate-950 dark:text-slate-50 animate-pulse-subtle">
                  {formattedPomoTime}
                </p>
                
                {pomoMode === 'STUDY' && (
                  <div className="w-full max-w-xs mx-auto text-xs font-bold text-left space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wide">Focus Subject</label>
                    <input 
                      type="text" 
                      value={pomoSubject}
                      onChange={(e) => setPomoSubject(e.target.value)}
                      placeholder="General Focus"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPomoActive(!pomoActive)}
                  className="px-4 py-2 text-xs font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition"
                >
                  {pomoActive ? <Pause size={14} /> : <Play size={14} />}
                  <span>{pomoActive ? 'Pause' : 'Start Focus'}</span>
                </button>
                <button
                  onClick={handlePomoReset}
                  className="p-2 text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
                  title="Reset Timer"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={handlePomoSkip}
                  className="p-2 text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
                  title="Skip/Complete Timer"
                >
                  <SkipForward size={15} />
                </button>
              </div>
            </div>

            {/* Manual Log Session Form */}
            <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 h-fit space-y-4">
              <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                <Plus className="text-blue-500" />
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-50 font-black uppercase tracking-wide">Manual Study Entry</h3>
              </div>

              <form onSubmit={handleLogSession} className="space-y-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase">Subject / Course</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Data Structures"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase">Session Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-slate-400 uppercase">Productivity (1 - 10)</label>
                    <span className="font-extrabold text-blue-500">{productivityRating}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={productivityRating}
                    onChange={(e) => setProductivityRating(e.target.value)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase">Notes / Concepts</label>
                  <textarea
                    placeholder="Completed homework section 3..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 transition"
                >
                  Log Session
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
