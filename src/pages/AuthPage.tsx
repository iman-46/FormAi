import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  signInWithGooglePopup,
  registerWithEmail,
  loginWithEmail,
  resetUserPassword,
} from '../firebase/auth';
import { BrandMark } from '../components/common/BrandMark';

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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] grid lg:grid-cols-12">
      {/* Editorial Architecture Panel (Desktop Left) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#0C0F16] text-slate-200 p-10 xl:p-14 flex-col justify-between border-r border-white/10">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white"
          >
            <BrandMark className="w-6 h-6" />
            <span>FormWise AI</span>
          </Link>

          <h2 className="font-display text-3xl font-bold tracking-tight text-white mt-12 leading-[1.15] text-balance">
            Your private workspace for dense forms and official notices.
          </h2>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md">
            Sign in to persist extracted action plans, document checklists, deadlines, and real Firebase AI Logic audit logs across sessions.
          </p>

          <div className="mt-10 space-y-5 border-t border-white/10 pt-8">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Local-First Parsing &amp; On-Device AI</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  PDFs and DOCX files are extracted inside Chrome; single-turn tasks prefer Chrome Gemini Nano.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Strict Account Isolation</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Cloud Firestore rules enforce per-user ownership and optional text-free metadata retention.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Source-Cited Reasoning</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Every simplified clause, deadline, and answer links back to exact document wording.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          FormWise AI · #BuildHybridAI 2026
        </p>
      </div>

      {/* Auth Form Area */}
      <div className="lg:col-span-7 flex flex-col justify-center px-4 sm:px-10 py-6 sm:py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-settle"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to FormWise AI
            </Link>
            <div className="lg:hidden flex items-center gap-2 font-display text-sm font-bold">
              <BrandMark className="w-5 h-5" />
              <span>FormWise AI</span>
            </div>
          </div>

          <div className="rounded-2xl surface-sheet p-5 sm:p-9">
            <div className="mb-6">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
                {mode === 'login'
                  ? 'Sign in to your workspace'
                  : mode === 'register'
                    ? 'Create your workspace account'
                    : 'Reset your password'}
              </h1>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {mode === 'reset'
                  ? 'Enter your email address to receive a secure password reset link.'
                  : 'Your documents, checklists, and hybrid AI logs are isolated to your account.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
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
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-sm font-medium flex items-center justify-center gap-2.5 transition-settle disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--border-hairline)]" />
                  <span className="text-[11px] text-[var(--text-muted)]">or continue with email</span>
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
                    <UserIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-sm font-semibold hover:opacity-90 transition-settle disabled:opacity-60"
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

            <div className="mt-6 pt-5 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setNotice(null);
                    }}
                    className="py-1.5 hover:text-[var(--text-primary)] font-medium transition-settle"
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
                    className="py-1.5 hover:text-[var(--text-primary)] transition-settle"
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
                  className="py-1.5 hover:text-[var(--text-primary)] font-medium transition-settle"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
