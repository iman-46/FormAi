import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Cloud,
  ShieldCheck,
  FileText,
  CalendarClock,
  CheckSquare,
  MessageSquareText,
  GitCompareArrows,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function LandingPage() {
  const { user, theme, toggleTheme, loadCompetitionDemo } = useApp();
  const navigate = useNavigate();

  const handleStartDemo = async () => {
    await loadCompetitionDemo(true);
    navigate('/analysis');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* 3-Zone Top Bar Contract */}
      <header className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            FormWise AI
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#capabilities" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#hybrid-ai" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Hybrid AI
            </a>
            <a href="#privacy" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Privacy
            </a>
            <a href="#demo" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Competition Demo
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="p-2 rounded-lg border border-[var(--border-hairline)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              to={user ? '/dashboard' : '/auth'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              {user ? 'Open Workspace' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-3">
              Built for #BuildHybridAI 2026 · Firebase AI Logic
            </p>
            <h1
              className="font-display font-bold tracking-tight text-balance text-[var(--text-primary)] leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
            >
              Understand paperwork. Know what to do next.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
              Upload any complex form, admission notice, policy, or instruction PDF. FormWise AI extracts plain-language clauses, verifies mandatory document checklists, builds an ordered action plan, and tracks deadlines using genuine on-device and cloud AI.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={user ? '/upload' : '/auth'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                Start Analyzing Documents
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => void handleStartDemo()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Try Competition Demo
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-hairline)] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span>PDF, DOCX &amp; TXT Extraction</span>
              <span aria-hidden="true">·</span>
              <span>On-Device Gemini Nano</span>
              <span aria-hidden="true">·</span>
              <span>Firebase App Check &amp; Firestore</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-xl overflow-hidden border border-[var(--border-hairline)] bg-slate-100 dark:bg-slate-900 relative">
              <img
                src="/src/assets/images/hero_document_workspace_1795796325315.jpg"
                alt="Printed application documents and sleek dark navy laptop in natural morning window light"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Grid */}
      <section id="capabilities" className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance mb-3">
              Every requirement extracted into an actionable workflow
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              No vague summaries or fabricated rules. Every clause, task, checklist item, and deadline links directly back to the wording in your document.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-7">
              <div className="flex items-center gap-2.5 text-xs font-mono text-violet-700 dark:text-violet-400 mb-3">
                <FileText className="w-4 h-4" />
                <span>01. Clause Simplifier &amp; Multi-Language Mode</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Three clarity levels in Simple English, Hindi, or Bengali
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 max-w-2xl">
                Switch between Very Simple, Standard, and Detailed breakdowns. Each card pairs the original clause with why it matters and what you should do next, preserving exact dates, fee amounts, and official terminology.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-hairline)] text-xs">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Very Simple</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Everyday vocabulary for rapid understanding</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Standard</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Balanced plain language with key citations</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Detailed</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Full eligibility conditions and exceptions</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-7">
              <div className="flex items-center gap-2.5 text-xs font-mono text-blue-700 dark:text-blue-400 mb-3">
                <CheckSquare className="w-4 h-4" />
                <span>02. Action Plan Generator</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Ordered checklists you control
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Convert dense instructions into step-by-step tasks with priority levels, source references, and due dates. Edit, add, reorder, or check off steps as you complete them.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-7">
              <div className="flex items-center gap-2.5 text-xs font-mono text-amber-700 dark:text-amber-400 mb-3">
                <CalendarClock className="w-4 h-4" />
                <span>03. Deadline Intelligence</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Zero invented dates
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Application, verification, payment, exam, and interview dates render on a clean timeline and monthly calendar. Ambiguous windows are automatically flagged for verification.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-7">
              <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-3">
                <MessageSquareText className="w-4 h-4" />
                <span>04. Grounded Ask AI</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Multi-turn Q&amp;A with citations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ask eligibility or missed-deadline questions powered by Cloud Gemini via Firebase AI Logic. Receives section references and explicit uncertainty warnings when details are absent.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-7">
              <div className="flex items-center gap-2.5 text-xs font-mono text-violet-700 dark:text-violet-400 mb-3">
                <GitCompareArrows className="w-4 h-4" />
                <span>05. Document Comparison</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Spot changed rules immediately
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Compare an original notice against an addendum or revised policy to surface changed deadlines, fee adjustments, and conflicting instructions side by side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hybrid AI Architecture Proof Section */}
      <section id="hybrid-ai" className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-[var(--border-hairline)] bg-slate-100 dark:bg-slate-900 aspect-[4/3]">
              <img
                src="/src/assets/images/feature_hybrid_architecture_1795796325207.jpg"
                alt="Minimalist frosted glass prisms and brushed aluminum blocks symbolizing on-device and cloud AI routing"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Genuine Hybrid AI powered by Firebase AI Logic
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              FormWise AI never fakes local inference. Every request flows through the official <span className="font-mono text-xs">firebase/ai</span> SDK using <span className="font-mono text-xs">InferenceMode.PREFER_ON_DEVICE</span>, <span className="font-mono text-xs">ONLY_ON_DEVICE</span>, or <span className="font-mono text-xs">PREFER_IN_CLOUD</span>, and displays the real <span className="font-mono text-xs">result.response.inferenceSource</span> returned by the SDK.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm mb-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>On-Device (Chrome Gemini Nano)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Handles single-turn summaries, clause explanations, key points, and terminology locally in supported desktop Chrome browsers after user-triggered initialization.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-semibold text-sm mb-1.5">
                  <Cloud className="w-4 h-4" />
                  <span>Cloud AI (Firebase Remote Config)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Handles multi-turn chat, two-document comparisons, scanned PDF OCR, and automatic fallback when local models are unavailable—strictly after session consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Competition Demo CTA */}
      <section id="privacy" className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-14">
        <div id="demo" className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy-First Architecture &amp; App Check Protection</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
              Test the complete 3-minute competition demo immediately
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Load our fictional Northbridge Institute Fall 2027 Admission Notice and Addendum No. 1, inspect real on-device/cloud fallback telemetry, generate action plans, and explore multi-turn Q&amp;A.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <button
              type="button"
              onClick={() => void handleStartDemo()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              Launch Fictional Demo Workspace
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-hairline)] py-8 px-6 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>FormWise AI — #BuildHybridAI 2026 Competition Submission</span>
        <span>
          Informational assistant only. Always verify official deadlines, fees, and eligibility directly with the issuing organization.
        </span>
      </footer>
    </div>
  );
}
