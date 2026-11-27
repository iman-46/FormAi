import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  CalendarClock,
  ClipboardCheck,
  MessageSquareText,
  GitCompareArrows,
  Activity,
  Settings,
  Upload,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AIStatusBadge } from '../ai/AIStatusBadge';
import { CloudConsentModal } from '../ai/CloudConsentModal';
import { resendVerificationEmail } from '../../firebase/auth';
import avatarDemoUser from '../../assets/images/avatar_demo_user_1795796326117.jpg';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { to: '/documents', label: 'My Documents', Icon: FileText },
  { to: '/action-plans', label: 'Action Plans', Icon: CheckSquare },
  { to: '/deadlines', label: 'Deadlines', Icon: CalendarClock },
  { to: '/checklist', label: 'Document Checklist', Icon: ClipboardCheck },
  { to: '/ask-ai', label: 'Ask AI', Icon: MessageSquareText },
  { to: '/compare', label: 'Compare Documents', Icon: GitCompareArrows },
  { to: '/ai-activity', label: 'AI Activity', Icon: Activity },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const;

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/upload': 'Upload Document',
  '/documents': 'My Documents',
  '/analysis': 'Document Analysis',
  '/simplified': 'Simplified Document',
  '/action-plans': 'Action Plans',
  '/deadlines': 'Deadlines',
  '/checklist': 'Document Checklist',
  '/ask-ai': 'Ask Your Document',
  '/compare': 'Compare Documents',
  '/ai-activity': 'Hybrid AI Transparency',
  '/settings': 'Account Settings',
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    user,
    theme,
    toggleTheme,
    documents,
    activeDocId,
    setActiveDocId,
    signOutSession,
    refreshAuthVerification,
    firestoreSyncError,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPageTitle = ROUTE_TITLES[location.pathname] || 'Workspace';

  const handleLogout = async () => {
    await signOutSession();
    navigate('/');
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setVerificationMsg('Verification email sent. Check your inbox, then click Refresh Status.');
    } catch (err) {
      setVerificationMsg(err instanceof Error ? err.message : 'Unable to send verification email.');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] dark:bg-[#070B14] text-slate-200 border-r border-slate-800/80">
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800/80">
        <Link
          to="/"
          className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          FormWise AI
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        <Link
          to="/upload"
          onClick={() => setMobileMenuOpen(false)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4 shrink-0" />
          Upload Document
        </Link>
      </div>

      {documents.length > 0 && (
        <div className="px-4 py-2">
          <label
            htmlFor="sidebar-active-doc"
            className="block text-[11px] font-medium text-slate-400 mb-1.5"
          >
            Active Document
          </label>
          <select
            id="sidebar-active-doc"
            value={activeDocId || ''}
            onChange={(e) => setActiveDocId(e.target.value || null)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Workspace navigation">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0 opacity-85" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {user ? (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL || avatarDemoUser}
              alt={user.displayName || 'Account avatar'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                {user.displayName || 'FormWise User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="block w-full text-center px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            Sign In to Sync Cloud
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 h-full">{sidebarContent}</div>
          <button
            type="button"
            aria-label="Close overlay"
            className="flex-1 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-xs border-b border-[var(--border-hairline)] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-[var(--border-hairline)] text-slate-600 dark:text-slate-300"
                aria-label="Open navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                <span className="hidden sm:inline whitespace-nowrap">Workspace</span>
                <span className="hidden sm:inline" aria-hidden="true">/</span>
                <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                  {currentPageTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <AIStatusBadge compact />
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                className="p-2 rounded-lg border border-[var(--border-hairline)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {user && !user.emailVerified && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Verify your email ({user.email}) to enable protected Cloud Firestore persistence. Local browser session analysis still works.
                {verificationMsg ? ` ${verificationMsg}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleResendVerification()}
                className="px-2.5 py-1 rounded border border-amber-400/60 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                Resend Email
              </button>
              <button
                type="button"
                onClick={() => void refreshAuthVerification()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {firestoreSyncError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 px-4 sm:px-6 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">Firestore sync notice: {firestoreSyncError}</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-[var(--border-hairline)] px-4 sm:px-6 py-4 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <span>
            FormWise AI is an informational document assistant, not an official authority, legal advisor, or substitute for verifying requirements with the issuing organization.
          </span>
          <span className="font-mono">Firebase AI Logic Hybrid</span>
        </footer>
      </div>

      <CloudConsentModal />
    </div>
  );
}
