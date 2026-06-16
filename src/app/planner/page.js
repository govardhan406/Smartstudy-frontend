'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, Circle, CalendarDays, BarChart2, Sparkles, Clock } from 'lucide-react';

export default function PlannerPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Common State
  const [dbLoading, setDbLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Group A State (Digital Planner)
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM'); // LOW | MEDIUM | HIGH
  const [taskEstHours, setTaskEstHours] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL'); // ALL | TODO | COMPLETED

  // Group B State (Manual Tracker)
  const [manualLogs, setManualLogs] = useState([]);
  const [manualDate, setManualDate] = useState('');
  const [manualPlannedHours, setManualPlannedHours] = useState('');
  const [manualCompletedHours, setManualCompletedHours] = useState('');
  const [manualTasksPlanned, setManualTasksPlanned] = useState('');
  const [manualTasksCompleted, setManualTasksCompleted] = useState('');

  // AI Schedule Builder State
  const [aiHours, setAiHours] = useState('3');
  const [aiStart, setAiStart] = useState('09:00');
  const [aiTimeline, setAiTimeline] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && token) {
      fetchPlannerData();
    }
  }, [user, loading, token, router]);

  const fetchPlannerData = async () => {
    setDbLoading(true);
    try {
      if (user?.profile?.researchGroupId === 'GROUP_A') {
        const res = await fetch(`${API_BASE}/planner/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks);
        }
      } else if (user?.profile?.researchGroupId === 'GROUP_B') {
        const res = await fetch(`${API_BASE}/planner/manual`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setManualLogs(data.logs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  // GROUP A: CREATE TASK
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!taskTitle || !taskSubject || !taskEstHours || !taskDeadline) {
      setError('All task fields are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/planner/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          subject: taskSubject,
          priority: taskPriority,
          estimatedHours: parseFloat(taskEstHours),
          deadline: taskDeadline
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Task scheduled successfully.');
        setTaskTitle('');
        setTaskSubject('');
        setTaskEstHours('');
        setTaskDeadline('');
        fetchPlannerData();
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  // GROUP A: TOGGLE STATUS
  const handleToggleTaskStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const res = await fetch(`${API_BASE}/planner/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Toggle task status error:', err);
    }
  };

  // GROUP A: DELETE TASK
  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`${API_BASE}/planner/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // GROUP B: CREATE MANUAL LOG
  const handleCreateManualLog = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!manualDate || manualPlannedHours === '' || manualCompletedHours === '' || manualTasksPlanned === '' || manualTasksCompleted === '') {
      setError('All manual log fields are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/planner/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: manualDate,
          plannedHours: parseFloat(manualPlannedHours),
          completedHours: parseFloat(manualCompletedHours),
          tasksPlanned: parseInt(manualTasksPlanned),
          tasksCompleted: parseInt(manualTasksCompleted)
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Manual planning log saved.');
        setManualDate('');
        setManualPlannedHours('');
        setManualCompletedHours('');
        setManualTasksPlanned('');
        setManualTasksCompleted('');
        fetchPlannerData();
      } else {
        setError(data.error || 'Failed to save log. A log entry might already exist for this date.');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  // GROUP B: DELETE MANUAL LOG
  const handleDeleteManualLog = async (id) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    try {
      const res = await fetch(`${API_BASE}/planner/manual/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI SCHEDULE GENERATOR ACTION
  const handleGenerateAISchedule = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/ai/schedule-builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          availableHours: parseFloat(aiHours),
          startHour: aiStart
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiTimeline(data.timeline);
      } else {
        setError(data.error || 'Failed to generate schedule.');
      }
    } catch (err) {
      setError('Connection error generating schedule.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter tasks (Group A)
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'TODO') return t.status !== 'COMPLETED';
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // Calendar render (Group A)
  const renderCalendar = () => {
    const daysInMonth = 30;
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `2026-06-${day.toString().padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => {
        const tDate = new Date(t.deadline);
        return tDate.getFullYear() === 2026 && tDate.getMonth() === 5 && tDate.getDate() === day;
      });

      days.push({
        day,
        dateString,
        tasks: dayTasks
      });
    }

    return (
      <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <CalendarDays className="text-blue-500" />
            <span>Study Calendar: June 2026</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Research Month 1</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase text-slate-400">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          <div className="aspect-square bg-slate-100/10 dark:bg-slate-900/10 border border-transparent rounded-lg"></div>
          
          {days.map((d) => {
            const isToday = d.day === 15;
            return (
              <div 
                key={d.day} 
                className={`aspect-square p-1 rounded-xl border flex flex-col justify-between transition ${
                  isToday 
                    ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' 
                    : 'border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                }`}
              >
                <span className={`text-[10px] font-bold ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                  {d.day}
                </span>

                <div className="flex flex-wrap gap-0.5 justify-end">
                  {d.tasks.map(t => (
                    <span 
                      key={t.id} 
                      title={t.title}
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.status === 'COMPLETED' 
                          ? 'bg-emerald-500' 
                          : t.priority === 'HIGH' 
                            ? 'bg-red-500' 
                            : 'bg-blue-500'
                      }`}
                    ></span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
              {user.profile.researchGroupId === 'GROUP_A' ? 'Digital Study Planner' : 'Manual Study Tracking Logs'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {user.profile.researchGroupId === 'GROUP_A' 
                ? 'Create priority tasks, organize study calendars, and manage deadlines.' 
                : 'Log your manually planned study hours, completed study hours, and task execution counts.'}
            </p>
          </div>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold">{success}</div>}

        {/* COHORT A: DIGITAL PLANNER */}
        {user.profile.researchGroupId === 'GROUP_A' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Monthly Calendar View & Tasks */}
            <div className="xl:col-span-2 space-y-6">
              {renderCalendar()}

              {/* Task list and filter card */}
              <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b dark:border-slate-800 pb-3">
                  <span className="font-extrabold text-sm text-slate-400 uppercase tracking-wide">Study Tasks & Deadlines</span>
                  
                  <div className="flex gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {['ALL', 'TODO', 'COMPLETED'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTaskFilter(f)}
                        className={`px-3 py-1 rounded-md transition ${taskFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y dark:divide-slate-800">
                  {filteredTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">No tasks found. Create a task to start organizing!</div>
                  ) : (
                    filteredTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            className="text-slate-400 hover:text-blue-500 transition"
                          >
                            {t.status === 'COMPLETED' ? (
                              <CheckCircle2 className="text-emerald-500" size={20} />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>

                          <div>
                            <p className={`text-sm font-bold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              {t.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                {t.subject}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                t.priority === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                                t.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' :
                                'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {t.priority}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Est: {t.estimatedHours} hrs | Due: {new Date(t.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Form & AI Schedule Builder Column */}
            <div className="space-y-6">
              
              {/* Task Creation Form */}
              <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 h-fit space-y-4">
                <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                  <CalendarIcon className="text-blue-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Schedule Study Task</h3>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Complete Lab Assignment 4"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Subject / Course</label>
                    <input
                      type="text"
                      required
                      placeholder="Computer Science"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Est. Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="2.5"
                        value={taskEstHours}
                        onChange={(e) => setTaskEstHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 transition"
                  >
                    Create Task
                  </button>
                </form>
              </div>

              {/* AI study schedule generator card */}
              <div className="p-6 rounded-2xl glass-panel border border-blue-500/20 bg-blue-500/5 dark:border-blue-500/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-500/10 pb-3">
                  <Sparkles className="text-blue-500 animate-pulse-subtle" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">AI Study Schedule Builder</h3>
                </div>

                <form onSubmit={handleGenerateAISchedule} className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Daily Study Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={aiHours}
                        onChange={(e) => setAiHours(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Preferred Start Time</label>
                      <input
                        type="time"
                        required
                        value={aiStart}
                        onChange={(e) => setAiStart(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="w-full py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Generate AI Study Schedule'}
                  </button>
                </form>

                {aiTimeline.length > 0 && (
                  <div className="space-y-3.5 pt-2 border-t border-blue-500/10">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Suggested Timeline:</span>
                    <div className="space-y-2">
                      {aiTimeline.map((block, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border dark:border-slate-800 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="font-extrabold text-[10px] text-slate-400">{block.timeFrame}</p>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-0.5">{block.subject}</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">{block.taskName} ({block.duration.toFixed(1)}h)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* COHORT B: MANUAL PLAN LOGGING */}
        {user.profile.researchGroupId === 'GROUP_B' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Table of logs */}
            <div className="xl:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                    <BarChart2 className="text-purple-500" />
                    <span>Planning Logs Record</span>
                  </div>
                  <span className="text-xs text-slate-400">Manual tracking details</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Planned Hours</th>
                        <th className="py-2.5">Completed Hours</th>
                        <th className="py-2.5">Tasks Planned</th>
                        <th className="py-2.5">Tasks Completed</th>
                        <th className="py-2.5 text-right">Execution Rate</th>
                        <th className="py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-850">
                      {manualLogs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">No manual planning logs entered. Add logs in the right panel!</td>
                        </tr>
                      ) : (
                        manualLogs.map((log) => {
                          const execRate = log.tasksPlanned > 0 ? (log.tasksCompleted / log.tasksPlanned) * 100 : 0;
                          return (
                            <tr key={log.id} className="hover:bg-slate-500/5 transition">
                              <td className="py-3 font-semibold">{new Date(log.date).toLocaleDateString()}</td>
                              <td className="py-3">{log.plannedHours} hrs</td>
                              <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{log.completedHours} hrs</td>
                              <td className="py-3">{log.tasksPlanned}</td>
                              <td className="py-3">{log.tasksCompleted}</td>
                              <td className="py-3 text-right font-extrabold text-emerald-500">{execRate.toFixed(0)}%</td>
                              <td className="py-3 text-center">
                                <button
                                  onClick={() => handleDeleteManualLog(log.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Log form & AI Schedule Column */}
            <div className="space-y-6">
              
              {/* Form Manual Log */}
              <div className="p-6 rounded-2xl glass-panel border dark:border-slate-800 h-fit space-y-4">
                <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                  <Plus className="text-purple-500" />
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Log Manual Plan Stats</h3>
                </div>

                <form onSubmit={handleCreateManualLog} className="space-y-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase">Log Date</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Planned Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="4.0"
                        value={manualPlannedHours}
                        onChange={(e) => setManualPlannedHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Completed Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="2.5"
                        value={manualCompletedHours}
                        onChange={(e) => setManualCompletedHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Tasks Planned</label>
                      <input
                        type="number"
                        required
                        placeholder="5"
                        value={manualTasksPlanned}
                        onChange={(e) => setManualTasksPlanned(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Tasks Completed</label>
                      <input
                        type="number"
                        required
                        placeholder="3"
                        value={manualTasksCompleted}
                        onChange={(e) => setManualTasksCompleted(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 transition"
                  >
                    Save Daily Log Entry
                  </button>
                </form>
              </div>

              {/* AI Schedule builder for Group B */}
              <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 bg-purple-500/5 dark:border-purple-500/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-500/10 pb-3">
                  <Sparkles className="text-purple-500 animate-pulse-subtle" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">AI Study Target Planner</h3>
                </div>

                <form onSubmit={handleGenerateAISchedule} className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Available Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={aiHours}
                        onChange={(e) => setAiHours(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase">Preferred Start</label>
                      <input
                        type="time"
                        required
                        value={aiStart}
                        onChange={(e) => setAiStart(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="w-full py-3 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Generate AI Study Target'}
                  </button>
                </form>

                {aiTimeline.length > 0 && (
                  <div className="space-y-3.5 pt-2 border-t border-purple-500/10">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Suggested Timeline:</span>
                    <div className="space-y-2">
                      {aiTimeline.map((block, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border dark:border-slate-800 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="font-extrabold text-[10px] text-slate-400">{block.timeFrame}</p>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-0.5">{block.subject}</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">{block.taskName} ({block.duration.toFixed(1)}h)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
