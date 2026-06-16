'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Calendar, BookOpen, School, Phone, Shield } from 'lucide-react';

function AuthForm() {
  const { user, login, register, completeProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT'); // STUDENT | ADMIN
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification & Reset simulations
  const [simulatedLink, setSimulatedLink] = useState('');
  
  // Profile form state (for student registration second step)
  const [showProfileStep, setShowProfileStep] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('MALE');
  const [profileLevel, setProfileLevel] = useState('UNDERGRADUATE');
  const [profileInstitution, setProfileInstitution] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileSemester, setProfileSemester] = useState('Semester 1');
  const [profileContact, setProfileContact] = useState('');
  const [assignmentMethod, setAssignmentMethod] = useState('random'); // random | pending

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.hasProfile || user.profile) {
        router.push('/dashboard');
      } else if (user.role === 'STUDENT') {
        setShowProfileStep(true);
      }
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        const res = await register(email, password, role);
        if (res.user.verificationLink) {
          setSimulatedLink(res.user.verificationLink);
          setSuccess('Account created! Verification link generated below.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await completeProfile({
        name: profileName,
        age: parseInt(profileAge),
        gender: profileGender,
        academicLevel: profileLevel,
        institution: profileInstitution,
        department: profileDepartment,
        semester: profileSemester,
        contactInfo: profileContact
      }, assignmentMethod);

      setSuccess('Profile completed! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedVerify = async () => {
    if (!simulatedLink) return;
    setError('');
    setSuccess('');
    
    // Parse token and email from the link
    const url = new URL(simulatedLink);
    const token = url.searchParams.get('token');
    const emailParam = url.searchParams.get('email');

    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: emailParam })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Email successfully verified!');
        setSimulatedLink('');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Connection failed during verification.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address in the input above first.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password reset link generated! See simulated box below.');
        setSimulatedLink(data.resetLink);
      } else {
        setError(data.error || 'Failed to process forgot password');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedReset = async () => {
    if (!simulatedLink) return;
    setError('');
    setSuccess('');

    const url = new URL(simulatedLink);
    const token = url.searchParams.get('token');
    const emailParam = url.searchParams.get('email');
    const newPass = prompt('Enter your new password:');
    if (!newPass) return;

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: emailParam, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password reset successfully. You can now login with your new password.');
        setSimulatedLink('');
        setActiveTab('login');
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  // Profile Form (Step 2 of Register)
  if (showProfileStep) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Complete Research Participant Profile</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Complete your profile to join the study and view your assigned group dashboard.</p>
          </div>

          {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold text-center">{error}</div>}
          {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold text-center">{success}</div>}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Amrutha Rao"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Age</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="number"
                    required
                    placeholder="21"
                    value={profileAge}
                    onChange={(e) => setProfileAge(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Gender</label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Academic Level</label>
                <select
                  value={profileLevel}
                  onChange={(e) => setProfileLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="UNDERGRADUATE">Undergraduate</option>
                  <option value="POSTGRADUATE">Postgraduate</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Institution</label>
                <div className="relative">
                  <School className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Delhi University"
                    value={profileInstitution}
                    onChange={(e) => setProfileInstitution(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Computer Science"
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Semester</label>
                <input
                  type="text"
                  required
                  placeholder="Semester 4"
                  value={profileSemester}
                  onChange={(e) => setProfileSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="+91 9988776655"
                    value={profileContact}
                    onChange={(e) => setProfileContact(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-3">
              <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Study Assignment Options</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="assignment"
                    value="random"
                    checked={assignmentMethod === 'random'}
                    onChange={() => setAssignmentMethod('random')}
                  />
                  Random Assignment (GROUP A/B) [Recommended]
                </label>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="assignment"
                    value="pending"
                    checked={assignmentMethod === 'pending'}
                    onChange={() => setAssignmentMethod('pending')}
                  />
                  Awaiting Researcher Manual Assignment
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
            >
              {loading ? 'Registering...' : 'Complete Registration & Join Study'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
      
      {/* Toggle tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); setSimulatedLink(''); }}
          className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
            activeTab === 'login' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
              : 'border-transparent text-slate-400'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); setSimulatedLink(''); }}
          className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
            activeTab === 'register' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
              : 'border-transparent text-slate-400'
          }`}
        >
          Create Account
        </button>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 text-sm font-bold text-center">{error}</div>}
      {success && <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-sm font-bold text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              required
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {activeTab === 'register' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Study Role</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={role === 'STUDENT'}
                  onChange={() => setRole('STUDENT')}
                />
                Student Participant
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={role === 'ADMIN'}
                  onChange={() => setRole('ADMIN')}
                />
                Research Administrator
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
        >
          {loading 
            ? 'Loading...' 
            : (activeTab === 'login' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      {activeTab === 'login' && (
        <div className="text-center">
          <button 
            onClick={handleForgotPassword}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      )}

      {/* Local Simulation Box for Verification / Reset */}
      {simulatedLink && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
            <Shield size={16} />
            <span>DEVELOPER EMAIL SIMULATOR</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            We intercepted the email server. You can click below to trigger the email token action locally:
          </p>
          {simulatedLink.includes('verify') ? (
            <button
              onClick={handleSimulatedVerify}
              className="w-full py-2 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition"
            >
              Simulate: Click Email Verification Link
            </button>
          ) : (
            <button
              onClick={handleSimulatedReset}
              className="w-full py-2 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition"
            >
              Simulate: Click Password Reset Link
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  );
}
