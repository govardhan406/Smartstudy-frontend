'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { ClipboardList, CheckCircle2, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

export default function SurveysPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [surveys, setSurveys] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: value }
  const [dbLoading, setDbLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && token) {
      fetchSurveys();
    }
  }, [user, loading, token, router]);

  const fetchSurveys = async () => {
    setDbLoading(true);
    try {
      const res = await fetch(`${API_BASE}/surveys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleSelectSurvey = (survey) => {
    setActiveSurvey(survey);
    // Initialize empty answers
    const initAnswers = {};
    survey.questions.forEach(q => {
      initAnswers[q.id] = '3'; // default scale midpoint
    });
    setAnswers(initAnswers);
    setError('');
    setSuccess('');
  };

  const handleOptionChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Prepare numerical values for scale answers
    const formattedAnswers = {};
    Object.entries(answers).forEach(([qId, val]) => {
      formattedAnswers[qId] = parseInt(val);
    });

    try {
      const res = await fetch(`${API_BASE}/surveys/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          surveyId: activeSurvey.id,
          answers: formattedAnswers
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`Survey submitted! Your calculated Time Management Score is ${data.timeManagementScore}/100.`);
        setActiveSurvey(null);
        fetchSurveys();
      } else {
        setError(data.error || 'Failed to submit response.');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">Weekly Surveys</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Answer research questionnaires to check your time management progress and planning scores.</p>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold">{success}</div>}

        {/* Survey Active Questionnaire Screen */}
        {activeSurvey ? (
          <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <button 
              onClick={() => setActiveSurvey(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Surveys List</span>
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-slate-50">{activeSurvey.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeSurvey.description}</p>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              <div className="space-y-6 divide-y dark:divide-slate-800">
                {activeSurvey.questions.map((q, idx) => (
                  <div key={q.id} className="pt-5 first:pt-0 space-y-3">
                    <div className="flex gap-2">
                      <span className="font-extrabold text-sm text-blue-500 leading-none">{idx + 1}.</span>
                      <h4 className="font-bold text-sm text-slate-950 dark:text-slate-50 leading-tight">{q.text}</h4>
                    </div>

                    {q.type === 'SCALE' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <label 
                              key={val}
                              className={`w-12 h-12 rounded-full border flex items-center justify-center font-extrabold text-sm cursor-pointer transition ${
                                answers[q.id] === val.toString()
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10'
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-500/5 text-slate-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={val}
                                checked={answers[q.id] === val.toString()}
                                onChange={() => handleOptionChange(q.id, val.toString())}
                                className="sr-only"
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">
                          <span>Completely Ineffective / Never</span>
                          <span>Highly Effective / Always</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Submit Survey Response
              </button>
            </form>
          </div>
        ) : (
          /* Surveys List Screen */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {surveys.map((survey) => (
              <div 
                key={survey.id} 
                className="p-6 rounded-2xl glass-panel border dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <ClipboardList size={20} />
                    </div>
                    {survey.completed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 uppercase">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-500 uppercase">
                        Pending
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{survey.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{survey.description}</p>
                </div>

                {survey.completed ? (
                  <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-emerald-500 mb-0.5">Assessment Result</p>
                    <p>Score: <strong className="text-slate-950 dark:text-white font-extrabold">{survey.score}/100</strong> (Calculated Time Management Index)</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Submitted on: {new Date(survey.submittedAt).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectSurvey(survey)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-1"
                  >
                    <span>Start Questionnaire</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
