import Image from "next/image";

export default function Home() {
  return (
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
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-8 items-start">
      <div className="text-5xl font-black text-blue-100 leading-none">{number}</div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-slate-600 text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
