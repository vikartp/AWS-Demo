import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { useAuthStore } from './store/authStore';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Placeholder Chat Page (Ready for Phase 5)
const ChatPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
      <span className="text-2xl">🤖</span>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">AI Conversational Assistant & RAG</h1>
    <p className="text-sm text-gray-600 max-w-md mx-auto">
      Retrieval-Augmented Generation (RAG) using Titan Embeddings & Claude Haiku will be integrated in <strong>Phase 5</strong>.
    </p>
  </div>
);

// Placeholder Dashboard Page
const DashboardPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
      <span className="text-2xl">📊</span>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">Application Metrics & Dashboards</h1>
    <p className="text-sm text-gray-600 max-w-md mx-auto">
      Access the pre-configured Grafana monitoring dashboards directly at{' '}
      <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">
        http://localhost:3002
      </a>.
    </p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:id"
              element={
                <ProtectedRoute>
                  <DocumentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
