import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { FileText, MessageSquare, BarChart3, LogIn } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">DocuMind</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/documents" className="text-gray-600 hover:text-primary-600 flex items-center gap-1">
              <FileText className="h-4 w-4" /> Documents
            </Link>
            <Link to="/chat" className="text-gray-600 hover:text-primary-600 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> AI Chat
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/login" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-1">
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered
            <span className="text-primary-600"> Document Assistant</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Upload documents, organize your knowledge, and ask questions using
            AI. Powered by Amazon Bedrock.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/documents" className="bg-primary-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-primary-700 transition-colors">
              Get Started
            </Link>
            <a href="https://github.com" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-lg hover:bg-gray-50 transition-colors">
              View Architecture
            </a>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-6 mt-16">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Document Management</h3>
              <p className="text-gray-600 text-sm">
                Upload, organize, search, and manage your documents with categories and tags.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <MessageSquare className="h-10 w-10 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm">
                Ask questions about your documents and get AI-powered answers with RAG.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <BarChart3 className="h-10 w-10 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Observability</h3>
              <p className="text-gray-600 text-sm">
                Monitor application health, API performance, and AI usage with Grafana dashboards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-gray-500 text-sm">
        DocuMind &mdash; A production-style MERN application on AWS &middot; Phase 2
      </footer>
    </div>
  );
}

function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Documents</h1>
      <p className="text-gray-600">Document management will be built in Phase 3.</p>
      <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">&larr; Back to Home</Link>
    </div>
  );
}

function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">AI Chat</h1>
      <p className="text-gray-600">AI chat will be built in Phase 5.</p>
      <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">&larr; Back to Home</Link>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Monitoring dashboards will be built in Phase 4.</p>
      <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">&larr; Back to Home</Link>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In to DocuMind</h1>
        <p className="text-gray-600 text-center mb-4">Authentication will be built in Phase 3.</p>
        <Link to="/" className="text-primary-600 hover:underline block text-center">&larr; Back to Home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
