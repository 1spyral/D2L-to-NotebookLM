"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [browser, setBrowser] = useState("Chrome");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) {
      setBrowser("Firefox");
    } else if (ua.includes("Edg")) {
      setBrowser("Edge");
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      setBrowser("Safari");
    } else {
      setBrowser("Chrome");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#3c4043] font-sans selection:bg-blue-100">
      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a73e8] text-[10px] font-bold text-white">
              D2L
            </div>
            <span className="font-medium text-[18px] tracking-tight text-[#202124]">
              D2L to NotebookLM
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-[14px] font-medium text-[#5f6368]">
            <a
              href="https://github.com/1spyral/D2lToNotebookLM"
              target="_blank"
              className="hover:text-[#1a73e8] transition-colors"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-medium text-[#202124] mb-6 tracking-tight">
              Course materials, <br /> meet <span className="text-[#1a73e8]">NotebookLM</span>
            </h1>
            <p className="text-lg md:text-xl text-[#5f6368] mb-10 max-w-2xl mx-auto leading-relaxed">
              One click to sync your D2L course content directly to AI. No more manual downloads or
              messy uploads.
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                className="bg-[#1a73e8] text-white px-8 py-3.5 rounded-full font-medium text-lg hover:bg-[#1765cc] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <span>Add to {browser}</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Arrow right</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── Simplified Features ─────────────────────────────────── */}
        <section className="py-20 bg-[#f8f9fa]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-medium text-[#202124] mb-2">Bulk Sync</h3>
                <p className="text-[#5f6368] text-sm leading-relaxed">
                  Grabs every PDF and link from your course Table of Contents in seconds.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-4">🚀</div>
                <h3 className="text-lg font-medium text-[#202124] mb-2">Direct Access</h3>
                <p className="text-[#5f6368] text-sm leading-relaxed">
                  Bypasses viewers to get source files directly, optimized for Waterloo D2L.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-lg font-medium text-[#202124] mb-2">Smart Bridge</h3>
                <p className="text-[#5f6368] text-sm leading-relaxed">
                  Integrated banner in NotebookLM for seamless material importing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Simple How to Use ─────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-medium text-[#202124] mb-12 text-center">How to Use</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                  1
                </div>
                <p className="text-[#5f6368]">Install the extension from your browser's store.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                  2
                </div>
                <p className="text-[#5f6368]">Click the Rocket button on any D2L course card.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                  3
                </div>
                <p className="text-[#5f6368]">
                  Open NotebookLM and click 'Import' to start studying.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[13px] text-[#5f6368]">
          <p>© 2026 D2L to NotebookLM. Open source project.</p>
          <div className="flex gap-6">
            <a
              href="https://github.com/1spyral/D2lToNotebookLM"
              target="_blank"
              className="hover:text-[#1a73e8]"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a href="/privacy" className="hover:text-[#1a73e8]">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
