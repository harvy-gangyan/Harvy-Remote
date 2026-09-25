import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  CheckCircle2,
  X,
  Wifi,
  Zap,
  QrCode,
  Download,
  Check,
  ShieldCheck,
  ExternalLink,
  Terminal,
  FileCode,
  Sparkles,
  Github,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTvName: string;
}

export const MobileInstallGuideModal: React.FC<MobileInstallGuideModalProps> = ({
  isOpen,
  onClose,
  activeTvName,
}) => {
  const { canInstall, isInstalled, installApp } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'github' | 'apk' | 'direct' | 'cli'>('github');
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Preferred public URL that works on any phone without login
  const publicShareUrl = 'https://ais-pre-4dcc3udzickfg7tk4mvs3t-112897043270.asia-southeast1.run.app';

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    publicShareUrl
  )}`;

  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest="${publicShareUrl}/manifest.json" && npx @bubblewrap/cli build`;

  const gitPushCommands = `git add . && git commit -m "Build Android APK via GitHub Actions" && git push origin main`;

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard?.writeText(bubblewrapCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleCopyGit = () => {
    navigator.clipboard?.writeText(gitPushCommands);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2000);
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    publicShareUrl
  )}&bgcolor=0a0e17&color=38bdf8&margin=4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Install on Mobile Phone</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  APK & PWA
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Standalone app on Android & iOS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'github'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-cyan-400" />
            <span>GitHub Actions Cloud APK</span>
            <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-400 text-slate-950 font-bold">Auto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'apk'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>1-Click PWABuilder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'direct'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Direct WebAPK (10s)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'cli'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Android Studio</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* TAB 0: GITHUB ACTIONS CLOUD APK BUILDER */}
          {activeTab === 'github' && (
            <div className="space-y-3">
              {/* 1-Click ZIP Downloads */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <Github className="w-4 h-4 text-cyan-400" />
                  <span>Build APK 100% Free via GitHub Actions</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We have added a pre-configured CI/CD workflow at <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code>. Whenever changes are pushed to your GitHub repository, GitHub automatically compiles a native signed <strong className="text-white">app-debug.apk</strong> for you in ~2 minutes!
                </p>

                {/* 1-Click Download Buttons for Local Git Push */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <a
                    href="/project-clean.zip"
                    download="harvy-tv-remote-latest.zip"
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all cursor-pointer no-underline text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Project (.zip)</span>
                  </a>
                  <a
                    href="/src.zip"
                    download="harvy-remote-src.zip"
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer no-underline text-center"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>src only (.zip)</span>
                  </a>
                </div>
              </div>

              {/* Troubleshooting: Why the GitHub sync option is missing */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why isn't the GitHub Sync option visible in AI Studio?</span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  Google AI Studio's top-bar <strong>"Sync to GitHub"</strong> button only appears if your Google AI Studio account was connected with write access when the project was first cloned. If it was imported or session tokens expired, AI Studio hides the button.
                </p>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-500/20 text-[10px] text-slate-300 space-y-1">
                  <div><strong>How to push the latest changes:</strong></div>
                  <div>1. Download <strong className="text-cyan-300">harvy-tv-remote-latest.zip</strong> above.</div>
                  <div>2. Unzip into your GitHub repo folder on your computer.</div>
                  <div>3. Run: <code className="text-cyan-300 font-mono">git add . && git commit -m "Update TV Remote" && git push origin main</code></div>
                </div>
              </div>

              {/* Step by step GitHub Actions instructions */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Push & Build in 3 Commands:</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300">
                  <li>
                    <strong>Terminal commands:</strong>
                    <div className="relative mt-1">
                      <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[9.5px] text-cyan-300 select-all overflow-x-auto">
                        {gitPushCommands}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyGit}
                        className="absolute right-1.5 top-1.5 p-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[9px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedGit ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    Open your repository on <strong>github.com</strong> and click the <strong className="text-cyan-300">"Actions"</strong> tab at the top.
                  </li>
                  <li>
                    Click on the workflow named <strong className="text-white">"Build Android APK"</strong> (or trigger with "Run workflow").
                  </li>
                  <li>
                    Once finished (~2 min), download <strong className="text-cyan-300">"Harvy-TV-Remote-Debug-APK"</strong> under <em>Artifacts</em> and install on your phone!
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-[10.5px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">Why GitHub Actions?</div>
                <p>
                  Compiling Android APKs requires Java JDK 21, Gradle, and the Android SDK Build Tools (~3 GB). GitHub Actions provides free cloud virtual machines with the Android SDK pre-installed to compile your APK automatically.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: GENERATE APK */}
          {activeTab === 'apk' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Package into an Android .APK File</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  You can package this remote into a standard Android package file (<strong>.apk</strong>) using Google's official Trusted Web Activity (TWA) engine via <strong>PWABuilder</strong>.
                </p>
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all cursor-pointer no-underline mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Open 1-Click APK Generator (PWABuilder)</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>

              {/* Step by step guide */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>3 Simple Steps to Build & Install:</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                  <li>
                    Click the button above or visit <strong className="text-cyan-300">pwabuilder.com</strong> with your app URL pre-filled.
                  </li>
                  <li>
                    Click <strong className="text-white">"Package for Android"</strong>. It automatically packages your custom TV remote icons, theme color, and manifest into a ready-to-install Android APK file.
                  </li>
                  <li>
                    Download the <strong>.apk</strong> file to your phone, tap to open it, and tap <strong className="text-emerald-400">Install</strong> (allow "Install from Unknown Sources" if prompted by your phone).
                  </li>
                </ol>
              </div>

              {/* App URL pre-filled */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Your App URL for APK packaging:
                </label>
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={publicShareUrl}
                    className="w-full bg-transparent px-2 text-[11px] text-cyan-300 font-mono focus:outline-none select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(publicShareUrl)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium text-[10px] flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT WEBAPK INSTALL (RECOMMENDED FOR ANDROID) */}
          {activeTab === 'direct' && (
            <div className="space-y-3">
              {/* Direct Install Button if in Chrome */}
              {canInstall && !isInstalled && (
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Instant 1-Tap Phone Install</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Android can automatically generate a native <strong>WebAPK</strong> directly from your browser. It installs to your phone's app drawer, runs without any address bar, and gets automatic updates.
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installing...' : 'Install App to Phone (No APK Download Needed)'}</span>
                  </button>
                </div>
              )}

              {/* If already running in standalone mode */}
              {isInstalled && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Standalone App Active!</strong> Running as an independent phone app without browser frame.</span>
                </div>
              )}

              {/* QR Code Quick Scan for Phone */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-semibold">
                  <QrCode className="w-4 h-4" />
                  <span>Scan with Phone Camera</span>
                </div>
                <div className="p-2 rounded-xl bg-[#0a0e17] border border-cyan-500/30 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code to open remote on mobile"
                    className="w-28 h-28 rounded-lg object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Point phone camera at this QR code to open & install
                </span>
              </div>

              {/* Step by step install */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-[11px] text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>How WebAPK Works on Android:</span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  When you tap <strong>"Install App"</strong> or open in Chrome on Android and tap <strong className="text-white">Menu (⋮) → "Install App"</strong>, Google Play Services generates a signed Android APK in the background. It appears in your phone app list just like any app from the Play Store.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CLI / BUBBLEWRAP & CAPACITOR */}
          {activeTab === 'cli' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Capacitor Native Android Project Ready</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The native Android codebase has already been initialized in the <code className="text-cyan-300">/android</code> folder with:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[10.5px] text-slate-300">
                  <li><strong className="text-white">MulticastLock</strong> enabled for zero-config TV network scanning.</li>
                  <li><code className="text-cyan-300">CHANGE_WIFI_MULTICAST_STATE</code> & <code className="text-cyan-300">ACCESS_WIFI_STATE</code> permissions added.</li>
                  <li><code className="text-cyan-300">usesCleartextTraffic=true</code> enabled for local TV REST & ADB connections.</li>
                </ul>

                <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">To build native APK in Android Studio:</span>
                  <code className="text-cyan-300 font-mono text-[11px] block select-all">
                    npm run cap:open
                  </code>
                  <span className="text-[10px] text-slate-500 block">
                    (Opens directly in Android Studio → Build → Build Bundle(s) / APK(s) → Build APK)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Alternative: Bubblewrap CLI (Command Line APK)</span>
                </h4>
                <div className="relative">
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto whitespace-pre-wrap break-all select-all">
                    {bubblewrapCommand}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="absolute right-2 top-2 p-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[9px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCli ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wi-Fi requirement notice */}
          <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Local Wi-Fi Network:</strong> Once installed on your phone, ensure your phone and <strong className="text-white">{activeTvName}</strong> are connected to the <span className="text-emerald-400">same Wi-Fi network</span> so IP commands reach the TV.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">100% Ad-Free • Zero Telemetry</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

