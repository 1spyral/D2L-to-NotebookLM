import Image from "next/image";

export default function Home() {
  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <span className="font-bold text-xl">🚀</span>
          </div>
          <span className="font-bold text-xl tracking-tight">D2L to NotebookLM</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
          <a href="https://github.com" className="hover:text-blue-600 transition-colors">GitHub</a>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          Download Extension
        </button>
      </nav>

      {/* Hero Section */}
      <header className="px-8 py-20 max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Study smarter with <span className="text-blue-600">NotebookLM</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
            Bridge the gap between your course materials and AI-powered insights. 
            Export D2L course files, PDFs, and links directly to NotebookLM in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
              Add to Chrome — It's Free
            </button>
            <button className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-slate-400 transition-all">
              Watch Demo
            </button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-slate-500 justify-center md:justify-start">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">U{i}</div>
              ))}
            </div>
            <span>Trusted by Waterloo students</span>
          </div>
        </div>
        <div className="flex-1 w-full max-w-xl">
          <div className="bg-slate-100 rounded-3xl p-4 shadow-2xl border border-slate-200">
            <div className="bg-white rounded-2xl overflow-hidden aspect-video flex items-center justify-center text-slate-300 font-bold border border-slate-100">
              {/* Placeholder for screenshot/video */}
              <div className="text-center">
                <div className="text-6xl mb-2">📸</div>
                <div className="text-sm uppercase tracking-widest text-slate-400">Preview Image</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-8 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to master your courses</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Stop manually downloading and re-uploading files. Let our extension handle the heavy lifting.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="⚡" 
            title="Instant Scraping" 
            description="One-click extraction of PDFs, course links, and documents directly from your D2L dashboard."
          />
          <FeatureCard 
            icon="🧠" 
            title="NotebookLM Sync" 
            description="Seamlessly bridge your materials into NotebookLM for AI-powered summaries and Q&A."
          />
          <FeatureCard 
            icon="🔒" 
            title="Privacy First" 
            description="Your data stays local and is transferred directly between D2L and NotebookLM. We never see your files."
          />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 max-w-5xl mx-auto px-8">
        <h2 className="text-3xl font-bold mb-12 text-center">Three steps to better studying</h2>
        <div className="space-y-16">
          <Step 
            number="01" 
            title="Install the Extension" 
            description="Add D2L to NotebookLM to your browser. It works with Chrome, Firefox, and Safari." 
          />
          <Step 
            number="02" 
            title="Navigate to D2L" 
            description="Log into your University portal. You'll see a new 'Upload to NotebookLM' button on every course card." 
          />
          <Step 
            number="03" 
            title="Analyze & Excel" 
            description="Click upload, open NotebookLM, and start chatting with your course materials instantly." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded text-white">🚀</div>
            <span className="font-bold text-lg">D2L to NotebookLM</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 D2L to NotebookLM. Open Source. Not affiliated with Google or D2L.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-400 transition-colors">GitHub</a>
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    <div className="min-h-screen bg-[#e8eaf6] text-[#1a1c2b] font-sans selection:bg-blue-100">
      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#c7cad8]/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-[11px] bg-[#1a73e8] text-[11px] font-bold text-white shadow-[0_1px_3px_rgba(26,115,232,0.30)]">
              D2L
            </div>
            <span className="font-display font-semibold text-[18px] tracking-tight">D2L to NotebookLM</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#5b5e72]">
            <a href="#features" className="hover:text-[#1a73e8] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1a73e8] transition-colors">How it works</a>
            <a href="https://github.com/1spyral/D2lToNotebookLM" target="_blank" className="hover:text-[#1a73e8] transition-colors">GitHub</a>
          </div>

          <button className="bg-[#1a73e8] text-white px-5 py-2 rounded-full text-[14px] font-semibold hover:bg-[#1765cc] transition-all shadow-[0_1px_3px_rgba(26,115,232,0.30)] hover:shadow-[0_4px_12px_rgba(26,115,232,0.35)]">
            Add to Chrome
          </button>
        </div>
      </nav>

      <main>
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <section className="pt-20 pb-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d3e3fd] text-[#0842a0] text-[12px] font-bold mb-6">
                <span>NEW</span>
                <span className="w-1 h-1 rounded-full bg-[#0842a0]"></span>
                <span>Waterloo Optimized</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.1] mb-8 tracking-tight">
                Your entire course, <br/> now in <span className="text-[#1a73e8]">NotebookLM</span>
              </h1>
              <p className="text-xl text-[#5b5e72] mb-10 max-w-2xl leading-relaxed">
                Stop downloading and re-uploading. Our extension adds a <span className="font-semibold text-[#1a73e8]">🚀 Rocket Button</span> to your D2L dashboard, syncing PDFs and links directly to AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-[#1a73e8] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1765cc] transition-all shadow-[0_4px_12px_rgba(26,115,232,0.35)] flex items-center justify-center gap-3">
                  <span>Get the Extension</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <button className="bg-white text-[#1a1c2b] border border-[#c7cad8] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#f1f3f4] transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-400 to-purple-400 opacity-20 blur-3xl rounded-full"></div>
              <div className="relative bg-white p-2 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#c7cad8]/50 overflow-hidden">
                <div className="bg-[#f8f9fa] rounded-[18px] aspect-[4/3] flex items-center justify-center border border-[#c7cad8]/20 group overflow-hidden">
                   <div className="flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-500">
                      <div className="text-6xl animate-bounce">🚀</div>
                      <div className="text-[14px] font-bold text-[#1a73e8] uppercase tracking-[2px]">Live Preview</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────── */}
        <section id="features" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-semibold mb-4 tracking-tight">Magical studying experience</h2>
              <p className="text-[#5b5e72] text-lg">Built specifically for students who want to save time.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Feature 
                icon="⌛" 
                title="Bulk TOC Scraping" 
                description="Our engine crawls your entire course Table of Contents and grabs every PDF, link, and doc in one pass."
                color="bg-[#d3e3fd]"
              />
              <Feature 
                icon="⬇️" 
                title="Direct File Downloads" 
                description="Waterloo-optimized downloader targets DirectFile endpoints to bypass the viewer and get the source PDF."
                color="bg-[#d8f5e3]"
              />
              <Feature 
                icon="🧠" 
                title="NotebookLM Bridge" 
                description="A specialized banner appears on Google NotebookLM whenever you have new materials ready to import."
                color="bg-[#fce8e6]"
              />
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section id="how-it-works" className="py-32 bg-[#f8f9fa]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-semibold mb-16 text-center tracking-tight">Ready in 30 seconds</h2>
            
            <div className="space-y-12">
              <Step number="1" title="Install" description="Add the extension from the Chrome Web Store." />
              <Step number="2" title="Scrape" description="Go to D2L and click the Rocket button on any course card." />
              <Step number="3" title="Chat" description="Open NotebookLM and click 'Import' to start studying." />
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-[#1a73e8] rounded-[32px] p-12 md:p-20 text-center text-white shadow-[0_8px_24px_rgba(26,115,232,0.4)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32"></div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">Ace your finals. <br/> Start today.</h2>
            <button className="bg-white text-[#1a73e8] px-10 py-4 rounded-full font-bold text-xl hover:bg-[#f1f3f4] transition-all relative z-10 shadow-lg">
              Download the Extension
            </button>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[#c7cad8]/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#5b5e72]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1a1c2b]">D2L to NotebookLM</span>
          </div>
          <p>© 2026. Open Source Project. Waterloo, ON.</p>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-[#1a73e8]">Privacy</a>
            <a href="https://github.com/1spyral/D2lToNotebookLM" target="_blank" className="hover:text-[#1a73e8]">GitHub</a>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          </div>
        </div>
      </footer>
    </div>
  );
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
function Feature({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  return (
    <div className="p-8 rounded-[24px] border border-[#c7cad8]/30 hover:border-[#1a73e8]/50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
      <div className={`w-12 h-12 ${color} rounded-[12px] flex items-center justify-center text-2xl mb-6 shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-[20px] font-semibold mb-3 tracking-tight">{title}</h3>
      <p className="text-[#5b5e72] leading-relaxed">{description}</p>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="flex gap-8 items-start">
      <div className="text-5xl font-black text-blue-100 leading-none">{number}</div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-slate-600 text-lg leading-relaxed">{description}</p>
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    <div className="flex gap-8 group">
      <div className="w-12 h-12 shrink-0 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 tracking-tight">{title}</h3>
        <p className="text-[#5b5e72] text-lg leading-relaxed">{description}</p>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
