import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DashboardLayout } from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import AnalysisPage from './pages/AnalysisPage';
import ActionPlanPage from './pages/ActionPlanPage';
import DeadlinesPage from './pages/DeadlinesPage';
import ChecklistPage from './pages/ChecklistPage';
import ChatPage from './pages/ChatPage';
import ComparePage from './pages/ComparePage';
import AIActivityPage from './pages/AIActivityPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedWorkspace({ children }: { children: React.ReactNode }) {
  const { user, authLoading, documents } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-xs text-slate-500">
        Initializing FormWise AI workspace...
      </div>
    );
  }

  // Allow seamless competition demo walkthrough when demo docs are loaded in-session,
  // while protecting unauthenticated direct visits to private workspace routes.
  const hasDemoActive = documents.some((d) => d.isDemo);
  if (!user && !hasDemoActive) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter basename="/FormAi">>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedWorkspace>
                  <DashboardPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedWorkspace>
                  <UploadPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedWorkspace>
                  <DocumentsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/analysis"
              element={
                <ProtectedWorkspace>
                  <AnalysisPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/simplified"
              element={
                <ProtectedWorkspace>
                  <AnalysisPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/action-plans"
              element={
                <ProtectedWorkspace>
                  <ActionPlanPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/deadlines"
              element={
                <ProtectedWorkspace>
                  <DeadlinesPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/checklist"
              element={
                <ProtectedWorkspace>
                  <ChecklistPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/ask-ai"
              element={
                <ProtectedWorkspace>
                  <ChatPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedWorkspace>
                  <ComparePage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/ai-activity"
              element={
                <ProtectedWorkspace>
                  <AIActivityPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedWorkspace>
                  <SettingsPage />
                </ProtectedWorkspace>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
