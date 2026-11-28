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
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AIStatusBadge } from '../ai/AIStatusBadge';
import { CloudConsentModal } from '../ai/CloudConsentModal';
import { BrandMark } from '../common/BrandMark';
import { resendVerificationEmail } from '../../firebase/auth';
import avatarDemoUser from '../../assets/images/avatar_demo_user_1795796326117.jpg';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
      { to: '/documents', label: 'My Documents', Icon: FileText },
      { to: '/analysis', label: 'Document Analysis', Icon: Sparkles },
    ],
  },
  {
    label: 'Workflow Modules',
    items: [
      { to: '/action-plans', label: 'Action Plans', Icon: CheckSquare },
      { to: '/deadlines', label: 'Deadlines', Icon: CalendarClock },
      { to: '/checklist', label: 'Document Checklist', Icon: ClipboardCheck },
      { to: '/ask-ai', label: 'Ask AI', Icon: MessageSquareText },
      { to: '/compare', label: 'Compare Documents', Icon: GitCompareArrows },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/ai-activity', label: 'AI Activity', Icon: Activity },
      { to: '/settings', label: 'Settings', Icon: Settings },
    ],
  },
] as const;

const MOBILE_TAB_ITEMS = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { to: '/upload', label: 'Upload', Icon: Upload },
  { to: '/analysis', label: 'Analyze', Icon: Sparkles },
  { to: '/ask-ai', label: 'Ask AI', Icon: MessageSquareText },
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
  const [avatarError, setAvatarError] = useState(false);
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
    <div className="flex flex-col h-full bg-[#0C0F16] dark:bg-[#07090D] text-slate-200 border-r border-white/10">
      <div className="px-5 h-16 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <BrandMark className="w-6 h-6 shrink-0" />
          <span>FormWise AI</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-white/10">
        <Link
          to="/upload"
          onClick={() => setMobileMenuOpen(false)}
          className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-settle whitespace-nowrap shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          Upload Document
        </Link>

        {documents.length > 0 && (
          <div>
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
              className="w-full min-h-[40px] rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#0C0F16] text-white">
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Workspace navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-medium text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 min-h-[40px] py-2 rounded-lg text-xs font-medium transition-settle whitespace-nowrap ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-85" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {user ? (
          <div className="flex items-center gap-3">
            {avatarError ? (
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-white/15 text-xs font-semibold text-white flex items-center justify-center shrink-0">
                {(user.displayName || user.email || 'F')[0].toUpperCase()}
              </div>
            ) : (
              <img
                src={user.photoURL || avatarDemoUser}
                alt={user.displayName || 'Account avatar'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-8 h-8 rounded-full object-cover border border-white/15 shrink-0"
              />
            )}
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
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-settle shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="block w-full text-center px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-settle"
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
          <div className="w-72 max-w-[82vw] h-full">{sidebarContent}</div>
          <button
            type="button"
            aria-label="Close overlay"
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: static on mobile (keeps sticky height <= 15% cap with bottom tab bar), sticky on desktop */}
        <header className="lg:sticky lg:top-0 z-30 h-14 lg:h-16 bg-[var(--bg-surface)]/95 backdrop-blur-sm border-b border-[var(--border-hairline)] px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)]"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-0">
              <span className="hidden sm:inline whitespace-nowrap">Workspace</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-display font-semibold text-sm text-[var(--text-primary)] truncate">
                {currentPageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <AIStatusBadge compact />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-settle"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {user && !user.emailVerified && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Verify your email ({user.email}) to enable protected Cloud Firestore persistence.
                {verificationMsg ? ` ${verificationMsg}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleResendVerification()}
                className="px-2.5 py-1.5 rounded-md border border-amber-400/60 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-settle"
              >
                Resend Email
              </button>
              <button
                type="button"
                onClick={() => void refreshAuthVerification()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 font-medium transition-settle"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {firestoreSyncError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 px-4 sm:px-8 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">Firestore sync notice: {firestoreSyncError}</span>
          </div>
        )}

        <main className="flex-1 px-4 py-5 sm:p-7 lg:p-9 pb-24 lg:pb-9 max-w-[1360px] w-full mx-auto">
          {children}
        </main>

        <footer className="hidden lg:flex border-t border-[var(--border-hairline)] px-8 py-4 text-[11px] text-[var(--text-muted)] items-center justify-between gap-3">
          <span>
            FormWise AI is an informational document assistant. Always verify official deadlines, fees, and eligibility directly with the issuing organization.
          </span>
          <span className="font-mono">Firebase AI Logic</span>
        </footer>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (56px height, <9% viewport) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-hairline)] grid grid-cols-4"
      >
        {MOBILE_TAB_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-settle ${
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <CloudConsentModal />
    </div>
  );
}
