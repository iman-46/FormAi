import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  signInWithGooglePopup,
  registerWithEmail,
  loginWithEmail,
  resetUserPassword,
} from '../firebase/auth';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await signInWithGooglePopup();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === 'reset') {
        await resetUserPassword(email);
        setNotice('Password reset instructions have been sent to your email address.');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        await registerWithEmail(email, password, displayName);
        navigate('/dashboard');
        return;
      }

      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.includes('auth/operation-not-allowed')) {
        setError(
          'Email/Password sign-in is not yet enabled in Firebase Console -> Authentication -> Sign-in method. Please enable it or use Google Sign-In.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to FormWise AI
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-7 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">
              {mode === 'login'
                ? 'Sign in to FormWise AI'
                : mode === 'register'
                  ? 'Create your workspace account'
                  : 'Reset your password'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'reset'
                ? 'Enter your email to receive a secure password reset link.'
                : 'Your documents, checklists, and hybrid AI logs are isolated to your account.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {mode !== 'reset' && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleGoogleSignIn()}
                className="w-full py-2.5 px-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
              >
                <span className="font-bold text-blue-600">G</span>
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border-hairline)]" />
                <span className="text-[11px] text-slate-400">or with email</span>
                <div className="h-px flex-1 bg-[var(--border-hairline)]" />
              </div>
            </>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-medium mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Sign In'
                  : mode === 'register'
                    ? 'Create Account'
                    : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setNotice(null);
                  }}
                  className="hover:text-[var(--text-primary)] font-medium"
                >
                  Create an account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setNotice(null);
                  }}
                  className="hover:text-[var(--text-primary)]"
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setNotice(null);
                }}
                className="hover:text-[var(--text-primary)] font-medium"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
