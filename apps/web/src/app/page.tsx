"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [browser, setBrowser] = useState("Chrome");

  useEffect(() => {
    const ua = navigator.userAgent;
    let detected = "Chrome";
    if (ua.includes("Firefox")) {
      detected = "Firefox";
    } else if (ua.includes("Edg")) {
      detected = "Edge";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      detected = "Safari";
    }

    if (detected !== "Chrome") {
      setTimeout(() => setBrowser(detected), 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#3c4043] font-sans selection:bg-blue-100">
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a73e8] text-[10px] font-bold text-white">
              D2L
            </div>
            <span className="text-[18px] font-medium tracking-tight text-[#202124]">
              D2L to NotebookLM
            </span>
          </div>

          <div className="hidden items-center gap-6 text-[14px] font-medium text-[#5f6368] sm:flex">
            <a
              href="https://github.com/1spyral/D2lToNotebookLM"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#1a73e8]"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-6 pb-20 pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-medium tracking-tight text-[#202124] md:text-6xl">
              Course materials, <br /> meet <span className="text-[#1a73e8]">NotebookLM</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#5f6368] md:text-xl">
              One click to sync your D2L course content directly to AI. No more manual downloads or
              messy uploads.
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-8 py-3.5 text-lg font-medium text-white shadow-sm transition-all hover:bg-[#1765cc] hover:shadow-md"
              >
                <span>Add to {browser}</span>
                <svg
                  className="h-5 w-5"
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

        <section className="bg-[#f8f9fa] py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 text-3xl">⚡</div>
                <h3 className="mb-2 text-lg font-medium text-[#202124]">Bulk Sync</h3>
                <p className="text-sm leading-relaxed text-[#5f6368]">
                  Grabs every PDF and link from your course Table of Contents in seconds.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-3xl">🚀</div>
                <h3 className="mb-2 text-lg font-medium text-[#202124]">Direct Access</h3>
                <p className="text-sm leading-relaxed text-[#5f6368]">
                  Bypasses viewers to get source files directly, optimized for Waterloo D2L.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-3xl">🧠</div>
                <h3 className="mb-2 text-lg font-medium text-[#202124]">Smart Bridge</h3>
                <p className="text-sm leading-relaxed text-[#5f6368]">
                  Integrated banner in NotebookLM for seamless material importing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center text-2xl font-medium text-[#202124]">How to Use</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs font-bold text-[#1a73e8]">
                  1
                </div>
                <p className="text-[#5f6368]">
                  Install the extension from your browser&apos;s store.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs font-bold text-[#1a73e8]">
                  2
                </div>
                <p className="text-[#5f6368]">Click the Rocket button on any D2L course card.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs font-bold text-[#1a73e8]">
                  3
                </div>
                <p className="text-[#5f6368]">
                  Open NotebookLM and click &apos;Import&apos; to start studying.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-[13px] text-[#5f6368] md:flex-row">
          <p>© 2026 D2L to NotebookLM. Open source project.</p>
          <div className="flex gap-6">
            <a
              href="https://github.com/1spyral/D2lToNotebookLM"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1a73e8]"
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
