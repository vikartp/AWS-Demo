import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Cloud, Cpu, ArrowRight, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-blue-50/50 via-white to-gray-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-6">
            <Cloud className="h-3.5 w-3.5" />
            <span>MERN &middot; AWS Serverless &middot; Amazon Bedrock &middot; Observability</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            AI-Powered Knowledge & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Document Assistant
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ingest technical guides, legal contracts, or notes. DocuMind extracts, organizes, and generates AI summaries via Amazon Bedrock, instrumented end-to-end with Prometheus & Grafana.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/documents' : '/register'}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-base hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? 'Open Documents' : 'Get Started Free'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-all text-base"
            >
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <span>Live Grafana Dashboard</span>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Backend-for-Frontend (BFF)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dedicated Express/Lambda BFF layer orchestrates requests, validates auth tokens, and provides single-turn aggregation for UI efficiency.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Async AI Ingestion</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Asynchronous event processing via worker queues decouping upload from AI summarization powered by Claude Haiku foundation models.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Full-Stack Observability</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Live Prometheus metrics scraped from BFF, backend services, and workers, rendered in pre-provisioned Grafana dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-6 text-center text-xs text-gray-500 border-t border-gray-200">
        <p>DocuMind Architecture Demo &middot; Built with React, Express, MongoDB, Docker, and AWS Bedrock</p>
      </footer>
    </div>
  );
};
