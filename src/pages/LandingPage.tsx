import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Cloud,
  ShieldCheck,
  FileText,
  CalendarClock,
  CheckSquare,
  GitCompareArrows,
  Play,
  Sun,
  Moon,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BrandMark } from '../components/common/BrandMark';
import heroDocumentWorkspace from '../assets/images/hero_document_workspace_1795796325315.jpg';
import featureHybridArchitecture from '../assets/images/feature_hybrid_architecture_1795796325207.jpg';

const PIPELINE_STEPS = [
  {
    index: '01',
    title: 'Browser-Local Extraction',
    detail: 'PDF.js & Mammoth parse files locally before any network request.',
  },
  {
    index: '02',
    title: 'Clause Simplification',
    detail: 'Very Simple, Standard, and Detailed breakdowns in 3 languages.',
  },
  {
    index: '03',
    title: 'Dates & Checklists',
    detail: 'Ordered action plans, mandatory proof checks, and verified timelines.',
  },
  {
    index: '04',
    title: 'Grounded Cloud Q&A',
    detail: 'Multi-turn chat and two-document addendum comparison with citations.',
  },
];

export default function LandingPage() {
  const { user, theme, toggleTheme, loadCompetitionDemo } = useApp();
  const navigate = useNavigate();
  const [heroImgError, setHeroImgError] = useState(false);
  const [archImgError, setArchImgError] = useState(false);
  const [demoPreviewLevel, setDemoPreviewLevel] = useState<'very_simple' | 'standard' | 'detailed'>('standard');

  const handleStartDemo = async () => {
    await loadCompetitionDemo(true);
    navigate('/analysis');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-x-hidden">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/92 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            <BrandMark className="w-6 h-6 shrink-0" />
            <span>FormWise AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--text-secondary)]">
            <a
              href="#capabilities"
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-settle whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#hybrid-ai"
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-settle whitespace-nowrap shrink-0"
            >
              Hybrid AI
            </a>
            <a
              href="#privacy"
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-settle whitespace-nowrap shrink-0"
            >
              Privacy
            </a>
            <a
              href="#demo"
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-settle whitespace-nowrap shrink-0"
            >
              Demo
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-settle"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              to={user ? '/dashboard' : '/auth'}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 min-h-[40px] rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle whitespace-nowrap shrink-0"
            >
              {user ? 'Workspace' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-[var(--border-hairline)] bg-architectural-grid overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 lg:pt-16 lg:pb-14">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-[var(--accent-primary)] mb-2.5 tracking-tight">
                #BuildHybridAI 2026 · Built with Firebase AI Logic
              </p>

              <h1
                className="font-display font-bold tracking-[-0.03em] text-balance text-[var(--text-primary)] leading-[1.08] mb-4"
                style={{ fontSize: 'clamp(2rem, 4.2vw, 3.75rem)' }}
              >
                Understand any document. Know what to do next.
              </h1>

              <p className="text-sm sm:text-[17px] text-[var(--text-secondary)] leading-[1.6] max-w-xl mb-6 sm:mb-8">
                Upload complex forms, admission notices, policies, or PDFs. FormWise AI turns dense official prose into plain-language explanations, ordered action checklists, verified deadlines, and document-grounded answers using Chrome on-device and cloud AI.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <Link
                  to={user ? '/upload' : '/auth'}
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] py-3 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-sm font-semibold hover:opacity-92 transition-settle whitespace-nowrap shadow-xs"
                >
                  Start Analyzing Documents
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => void handleStartDemo()}
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] py-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap"
                >
                  <Play className="w-4 h-4 text-[var(--accent-primary)]" />
                  Launch Interactive Demo
                </button>
              </div>

              <div className="mt-6 sm:mt-8 pt-5 border-t border-[var(--border-hairline)] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)]">
                <span>PDF, DOCX &amp; TXT Parsing</span>
                <span aria-hidden="true">·</span>
                <span>Chrome Gemini Nano Ready</span>
                <span aria-hidden="true">·</span>
                <span>Simple English, Hindi &amp; Bengali</span>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="w-full h-56 sm:h-80 lg:h-auto lg:min-h-[420px] rounded-2xl overflow-hidden surface-sheet relative flex flex-col">
                {heroImgError ? (
                  <div className="flex-1 bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-10 h-10 text-[var(--accent-primary)] mb-3" />
                    <p className="font-display text-sm font-semibold">FormWise AI Document Studio</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Local PDF &amp; DOCX extraction paired with hybrid Firebase AI reasoning.
                    </p>
                  </div>
                ) : (
                  <img
                    src={heroDocumentWorkspace}
                    alt="Printed application documents and sleek dark navy laptop in natural morning window light"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover flex-1"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Pipeline Strip Below Hero Split (gap-px prevents broken divide borders on 1/2/4 cols) */}
          <div className="mt-8 sm:mt-10 rounded-xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--border-hairline)] grid sm:grid-cols-2 lg:grid-cols-4 gap-px shadow-xs">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.index} className="p-4 sm:p-5 bg-[var(--bg-surface)]">
                <p className="font-mono text-[11px] font-semibold text-[var(--accent-primary)] mb-1">
                  {step.index}
                </p>
                <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {step.title}
                </h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Bento Grid */}
      <section id="capabilities" className="bg-[var(--bg-surface)] py-12 sm:py-16 lg:py-22 border-b border-[var(--border-hairline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[var(--accent-primary)] mb-2">
                Complete Document Intelligence
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Every requirement extracted into an actionable workflow
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
              Every simplified clause, step, checklist item, and date stays grounded in the exact wording of your uploaded file.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* Marquee Interactive Preview Card (col-span-2) */}
            <div className="md:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 sm:p-7 flex flex-col justify-between gap-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-[var(--accent-primary)] mb-1.5">
                    01. Clause Simplifier &amp; Multi-Language Mode
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                    Three clarity levels that preserve exact rules
                  </h3>
                </div>

                {/* Live Interactive Preview Switcher (full width grid on mobile) */}
                <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] w-full sm:w-auto shrink-0">
                  {(
                    [
                      ['very_simple', 'Very Simple'],
                      ['standard', 'Standard'],
                      ['detailed', 'Detailed'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDemoPreviewLevel(val)}
                      className={`px-2 sm:px-2.5 py-2 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                        demoPreviewLevel === val
                          ? 'bg-[#111318] dark:bg-[#4F46E5] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">Original Clause</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    "Provisionally admitted candidates must remit the non-refundable seat confirmation deposit of $450.00 on or before 18 March 2027 (17:00 UTC), failing which the offer shall stand automatically forfeited."
                  </p>
                </div>
                <div className="space-y-1.5 pt-3 border-t sm:pt-0 sm:border-t-0 sm:border-l border-[var(--border-hairline)] sm:pl-4">
                  <p className="text-[11px] font-medium text-[var(--accent-primary)]">
                    {demoPreviewLevel === 'very_simple'
                      ? 'Very Simple Explanation'
                      : demoPreviewLevel === 'standard'
                        ? 'Standard Plain-Language'
                        : 'Detailed Breakdown'}
                  </p>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {demoPreviewLevel === 'very_simple'
                      ? 'Pay $450 before March 18, 2027 at 5:00 PM UTC to keep your spot. You cannot get this $450 back.'
                      : demoPreviewLevel === 'standard'
                        ? 'To lock in your admission offer, submit the $450 non-refundable confirmation deposit by March 18, 2027 (17:00 UTC), or your seat will be canceled.'
                        : 'Section 3 requires a $450.00 non-refundable seat confirmation payment by 18 March 2027 at 17:00 UTC. Missing this cutoff automatically forfeits provisional admission.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span>Available in Simple English · Hindi · Bengali</span>
                <button
                  type="button"
                  onClick={() => void handleStartDemo()}
                  className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap py-1"
                >
                  Open full simplifier demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Plan Preview Card */}
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 sm:p-7 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-[var(--accent-primary)]">02. Action Plan</p>
                  <CheckSquare className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight mb-2">
                  Ordered checklists you control
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Edit, add, prioritize, and check off every step linked back to its source section.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] divide-y divide-[var(--border-hairline)] text-xs">
                <div className="p-3 flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="line-through text-[var(--text-muted)] truncate">
                    Verify 75% GPA eligibility threshold
                  </span>
                </div>
                <div className="p-3 flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded border border-[var(--border-hairline)] shrink-0" />
                  <span className="font-medium truncate">Gather notarized academic transcript</span>
                </div>
                <div className="p-3 flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded border border-[var(--border-hairline)] shrink-0" />
                  <span className="font-medium truncate">Pay $450 seat deposit by Mar 18</span>
                </div>
              </div>
            </div>

            {/* Deadline Intelligence Card */}
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 sm:p-7 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-amber-700 dark:text-amber-400">03. Deadlines</p>
                  <CalendarClock className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight mb-2">
                  Timeline &amp; monthly calendar
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Zero invented dates. Ambiguous windows are automatically flagged for verification.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[var(--accent-primary)] tabular-nums shrink-0">
                    MAR 18
                  </span>
                  <span className="text-[var(--text-primary)] truncate">Seat Deposit Cutoff</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" /> TBD
                  </span>
                  <span className="text-[var(--text-muted)] truncate">Document Verification Slot</span>
                </div>
              </div>
            </div>

            {/* Document Comparison + Grounded Q&A (col-span-2) */}
            <div className="md:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 sm:p-7 grid sm:grid-cols-2 gap-6">
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono text-[var(--accent-primary)]">04. Grounded Ask AI</p>
                    <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight mb-2">
                    Multi-turn document Q&amp;A
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Ask eligibility, fee, or missed-deadline questions powered by Cloud Gemini with explicit section citations and uncertainty warnings.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 text-xs space-y-1.5">
                  <p className="font-medium text-[var(--text-primary)]">"What happens if I miss March 18?"</p>
                  <p className="text-[var(--text-muted)]">
                    Offer stands automatically forfeited per Section 3.2 unless extended via written addendum.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 pt-5 border-t sm:pt-0 sm:border-t-0 sm:border-l border-[var(--border-hairline)] sm:pl-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono text-[var(--accent-primary)]">05. Document Diff</p>
                    <GitCompareArrows className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight mb-2">
                    Compare two versions side by side
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Spot changed deadlines, new certificate rules, and conflicting instructions between an original notice and an addendum.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 text-xs space-y-1.5">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Deadline shifted: Mar 18 → Mar 25
                  </p>
                  <p className="text-[var(--text-muted)]">
                    Addendum No. 1 extends confirmation window by 7 days for international wire transfers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hybrid AI Architecture Proof Section */}
      <section id="hybrid-ai" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-22">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden surface-sheet aspect-[4/3] flex flex-col">
              {archImgError ? (
                <div className="flex-1 bg-gradient-to-br from-slate-100 to-indigo-100/60 dark:from-slate-900 dark:to-indigo-950/40 flex flex-col items-center justify-center p-8 text-center">
                  <Cpu className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-3" />
                  <p className="font-display text-sm font-semibold">Hybrid AI Routing</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Chrome Prompt API + Firebase AI Logic Cloud Fallback
                  </p>
                </div>
              ) : (
                <img
                  src={featureHybridArchitecture}
                  alt="Minimalist frosted glass prisms and brushed aluminum blocks symbolizing on-device and cloud AI routing"
                  referrerPolicy="no-referrer"
                  onError={() => setArchImgError(true)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div>
              <p className="text-xs font-medium text-[var(--accent-primary)] mb-2">
                Genuine Hybrid AI Architecture
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Real on-device and cloud routing via Firebase AI Logic
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mt-3">
                FormWise AI executes real requests through the official{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
                  firebase/ai
                </code>{' '}
                SDK and reports the exact{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
                  result.response.inferenceSource
                </code>{' '}
                returned at runtime.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--border-hairline)] grid sm:grid-cols-2 gap-px shadow-xs">
              <div className="p-5 space-y-2 bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <Cpu className="w-4 h-4 shrink-0" />
                  <span>On-Device (Chrome Gemini Nano)</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Handles single-turn summaries, clause simplification, key points, and terminology locally in supported desktop Chrome after explicit user model initialization.
                </p>
              </div>
              <div className="p-5 space-y-2 bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-sm">
                  <Cloud className="w-4 h-4 shrink-0" />
                  <span>Cloud AI (Firebase Remote Config)</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Handles multi-turn chat, two-document comparisons, scanned PDF OCR, and automatic fallback when local models are unavailable—strictly after session consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Competition Demo CTA */}
      <section id="privacy" className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 sm:py-14">
        <div id="demo" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-6 sm:p-10 grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Privacy-First Parsing · Firebase App Check &amp; Firestore Isolation</span>
              </div>
              <h2 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-balance mb-2.5">
                Walk through the complete 3-minute competition demo
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                Load the fictional Northbridge Institute Fall 2027 Admission Notice and Addendum No. 1, inspect live on-device/cloud fallback telemetry, generate action plans, and test multi-turn grounded Q&amp;A.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                type="button"
                onClick={() => void handleStartDemo()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[46px] py-3 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-sm font-semibold hover:opacity-90 transition-settle whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                Launch Demo Workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-hairline)] py-7 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <BrandMark className="w-4 h-4" />
          <span>FormWise AI — #BuildHybridAI 2026</span>
        </div>
        <span>
          Informational document assistant only. Always verify official deadlines, fees, and eligibility directly with the issuing organization.
        </span>
      </footer>
    </div>
  );
}
