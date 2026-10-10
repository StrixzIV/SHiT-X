import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  BookOpen, 
  FileText, 
  LogIn, 
  AlertTriangle, 
  Flame, 
  Wrench, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  Check, 
  Printer, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Waves, 
  Activity, 
  ExternalLink,
  PhoneCall,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('edu'); // 'edu' | 'prevent' | 'detect' | 'report'
  
  // Battery API & Hardware Detection States
  const [isSupported] = useState(() => typeof navigator !== 'undefined' && 'getBattery' in navigator);
  const [hardwareCharging, setHardwareCharging] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  
  // Manual Simulator Override (crucial for iOS/Safari or desktop demo)
  const [manualSimulationActive, setManualSimulationActive] = useState(false);
  const [manualCharging, setManualCharging] = useState(false);

  // Computed live charging state
  const isCharging = manualSimulationActive ? manualCharging : hardwareCharging;

  // Probe scanning & diagnostics
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningLiveValue, setScanningLiveValue] = useState(0);
  const [testedVoltage, setTestedVoltage] = useState(null); // null | number
  const [hasScannedOnce, setHasScannedOnce] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState(null);

  // Audio & Sensory Effects
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState(() => ({
    id: `KMITL-STUPID-2569-4048`,
    date: '10/10/2569',
  }));

  // Stage 2 Checklist states
  const [breakerChecked, setBreakerChecked] = useState(true);
  const [unplugChecked, setUnplugChecked] = useState(true);
  const [rubberBootsChecked, setRubberBootsChecked] = useState(true);
  const [phoneFuseConsent, setPhoneFuseConsent] = useState(false);
  const [showConsentWarning, setShowConsentWarning] = useState(false);

  const audioContextRef = useRef(null);

  // Sound synthesizer for electric shock / scanning
  const playBeep = useCallback((freq = 440, duration = 0.15, type = 'sine') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio might be blocked before interaction
    }
  }, [soundEnabled]);

  const triggerShockAudio = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio block ignore
    }
  }, [soundEnabled]);

  // Sensory Feedback: Haptic vibration as specified in IMPLEMENTATIONS.md
  const triggerShockVibration = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 600]);
    }
    triggerShockAudio();
  }, [triggerShockAudio]);

  // Initialize and listen to Battery API
  useEffect(() => {
    let batteryRef = null;

    const handleChargingChange = () => {
      if (batteryRef) {
        setHardwareCharging(batteryRef.charging);
        if (batteryRef.charging) {
          triggerShockVibration();
        }
      }
    };

    const handleLevelChange = () => {
      if (batteryRef) {
        setBatteryLevel(Math.round(batteryRef.level * 100));
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        batteryRef = battery;
        setHardwareCharging(battery.charging);
        setBatteryLevel(Math.round(battery.level * 100));

        battery.addEventListener('chargingchange', handleChargingChange);
        battery.addEventListener('levelchange', handleLevelChange);
      }).catch(() => {
        // Fallback gracefully
      });
    }

    return () => {
      if (batteryRef) {
        batteryRef.removeEventListener('chargingchange', handleChargingChange);
        batteryRef.removeEventListener('levelchange', handleLevelChange);
      }
    };
  }, [triggerShockVibration]);

  // Watch for charging changes during simulation
  useEffect(() => {
    if (manualSimulationActive && manualCharging) {
      triggerShockVibration();
    }
  }, [manualSimulationActive, manualCharging, triggerShockVibration]);

  // Login button handler per CI requirements
  const handleLoginClick = () => {
    alert("เซิร์ฟเวอร์จมน้ำอยู่ ไม่สามารถเข้าสู่ระบบได้");
  };

  // Stage 2: Proceed to detection validation
  const handleProceedToDetect = () => {
    if (!phoneFuseConsent) {
      setShowConsentWarning(true);
      playBeep(250, 0.2, 'square');
      return;
    }
    setShowConsentWarning(false);
    setActiveTab('detect');
  };

  // Stage 3: Start inspection probe simulation
  const handleStartInspection = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanningLiveValue(isCharging ? 888 : 12);
    setTestedVoltage(null);
    playBeep(520, 0.1, 'sine');

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setIsScanning(false);
        setHasScannedOnce(true);
        const now = new Date();
        setScanTimestamp(now.toLocaleTimeString('th-TH'));

        if (isCharging) {
          setTestedVoltage(9999);
          triggerShockVibration();
        } else {
          setTestedVoltage(0);
          playBeep(660, 0.25, 'triangle');
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 }
            });
          } catch {
            // Confetti ignore
          }
        }
      } else {
        setScanProgress(current);
        const simulatedFluctuation = isCharging 
          ? Math.round(5000 + (current / 100) * 4999) 
          : Math.round((current / 100) * 40);
        setScanningLiveValue(simulatedFluctuation);
        playBeep(400 + current * 4, 0.05, 'sine');
      }
    }, 150);
  };

  const handleOpenCertificate = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setCertificateData({
      id: `KMITL-STUPID-2569-${randomDigits}`,
      date: new Date().toLocaleDateString('th-TH'),
    });
    setShowCertificateModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans antialiased flex flex-col justify-between selection:bg-[#E35205] selection:text-white">
      
      {/* ================= HERO HEADER (KMITL CI STYLE) ================= */}
      <header className="relative bg-[#1A1A1A] text-white pt-10 pb-20 px-4 sm:px-8 overflow-hidden shadow-2xl border-b-4 border-[#E35205]">
        {/* Background Overlay & Flood Ambience */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center filter blur-md scale-110 pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#1A1A1A]/75 to-[#1A1A1A]" />

        {/* Diagonal Tech Grid Motif */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#E35205 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative max-w-6xl mx-auto flex flex-col justify-between">
          
          {/* Top Bar: KMITL Lab Brand & Login */}
          <div className="flex items-center justify-between w-full border-b border-gray-800/80 pb-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-xl border-2 border-[#E35205] bg-black/60 shadow-[0_0_15px_rgba(227,82,5,0.4)] flex items-center justify-center shrink-0">
                <Zap className="w-7 h-7 text-[#E35205] fill-[#E35205]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest uppercase bg-[#E35205] text-white px-2 py-0.5 rounded text-[10px]">
                    OFFICIAL EXPERIMENTAL
                  </span>
                  <span className="text-xs text-gray-400 font-mono hidden sm:inline">SYS-REV. 2569.10</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold tracking-wide text-gray-100 uppercase mt-0.5">
                  KMITL STUPID LAB: Flood Electricity Division
                </h2>
                <p className="text-xs text-gray-400 font-light">
                  สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง • ศูนย์วิจัยมวลน้ำและการนำไฟฟ้าชาร์จเจอร์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "ปิดเสียงสัญญาณ" : "เปิดเสียงสัญญาณ"}
                className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs flex items-center gap-1 border border-gray-700"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                <span className="hidden md:inline">{soundEnabled ? 'เสียงเปิด' : 'เสียงปิด'}</span>
              </button>

              <button 
                onClick={handleLoginClick}
                className="flex items-center gap-2 bg-[#E35205] hover:bg-[#d04904] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-orange-600/30 transition duration-150 border border-orange-400/30"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>
            </div>
          </div>

          {/* Hero Main Titles */}
          <div className="text-center my-8 sm:my-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 text-xs font-medium mb-3">
              <Activity className="w-3.5 h-3.5 text-[#E35205] animate-pulse" />
              มาตรฐานนวัตกรรมสู้ภัยน้ำท่วมระดับชาติ (ฉบับประดิษฐ์ขึ้นเอง)
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-md leading-tight">
              KMITL <span className="text-[#E35205]">Hydro-Charge</span> Sentinel
            </h1>
            <p className="text-sm sm:text-lg text-gray-300 font-light leading-relaxed">
              ระบบตรวจสอบกระแสไฟฟ้ารั่วไหลในมวลน้ำผ่านอินเทอร์เฟซ USB สากล
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 font-mono">
              [ อุปกรณ์ตรวจวัด: ปลายสายชาร์จสมาร์ทโฟนของท่านเอง • ความแม่นยำ: ขึ้นอยู่กับค่าความนำไฟฟ้าของน้ำคลอง ]
            </p>
          </div>

        </div>
      </header>

      {/* ================= FLOATING ACTION TAB BAR ================= */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-30 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-2 sm:p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 backdrop-blur-sm">
          
          {/* TAB 1 */}
          <button
            onClick={() => setActiveTab('edu')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'edu'
                ? 'text-[#E35205] bg-orange-50/80 shadow-sm border-2 border-[#E35205]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <span className="absolute top-1 right-2 text-[10px] font-mono opacity-50">#01</span>
            <BookOpen className={`w-5 h-5 mb-1.5 ${activeTab === 'edu' ? 'text-[#E35205]' : 'text-gray-400'}`} />
            ความรู้เรื่องน้ำท่วม
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveTab('prevent')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'prevent'
                ? 'text-[#E35205] bg-orange-50/80 shadow-sm border-2 border-[#E35205]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <span className="absolute top-1 right-2 text-[10px] font-mono opacity-50">#02</span>
            <ShieldAlert className={`w-5 h-5 mb-1.5 ${activeTab === 'prevent' ? 'text-[#E35205]' : 'text-gray-400'}`} />
            การป้องกันไฟฟ้า
          </button>

          {/* TAB 3 (MAIN) */}
          <button
            onClick={() => setActiveTab('detect')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'detect'
                ? 'text-[#E35205] bg-orange-50/80 shadow-sm border-2 border-[#E35205]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <span className="absolute top-1 right-2 text-[10px] font-mono font-bold text-[#E35205]">#03 MAIN</span>
            <div className="relative">
              <Zap className={`w-5 h-5 mb-1.5 ${activeTab === 'detect' ? 'text-[#E35205] fill-[#E35205]' : 'text-gray-400'}`} />
              {isCharging && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            เช็คไฟรั่ว (Main)
          </button>

          {/* TAB 4 */}
          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'report'
                ? 'text-[#E35205] bg-orange-50/80 shadow-sm border-2 border-[#E35205]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <span className="absolute top-1 right-2 text-[10px] font-mono opacity-50">#04</span>
            <FileText className={`w-5 h-5 mb-1.5 ${activeTab === 'report' ? 'text-[#E35205]' : 'text-gray-400'}`} />
            สรุปผล & ช่วยเหลือ
          </button>

        </div>
      </div>

      {/* ================= CONTENT MAIN SECTION ================= */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10 flex-1 w-full">

        {/* ----------------- STAGE 1: ความรู้เรื่องน้ำท่วม (Flood Awareness) ----------------- */}
        {activeTab === 'edu' && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 sm:p-10 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#E35205] tracking-widest uppercase">STAGE 1 : FUNDAMENTALS</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <BookOpen className="w-6 h-6 text-[#E35205]" />
                  ความรู้เรื่องน้ำท่วมและกายภาพของมวลน้ำ
                </h3>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-mono">
                วารสารวิชาการ KMITL-SHIT
              </span>
            </div>

            {/* Satirical Scientific Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              
              <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-100 hover:border-orange-200 transition">
                <div className="w-8 h-8 rounded-lg bg-[#E35205]/10 text-[#E35205] flex items-center justify-center font-bold text-sm mb-3">
                  01
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1.5 flex items-center gap-2">
                  กฎฟิสิกส์พื้นฐานเรื่องมวลน้ำ
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <em>"กฎฟิสิกส์: น้ำเปียกเสมอ หากระดับน้ำสูงขึ้นแปลว่ามีน้ำเพิ่มขึ้น"</em> และหากระดับน้ำท่วมมิดหัวเข่า แปลว่าท่านไม่สามารถเดินแบบเท้าแห้งได้อีกต่อไป
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 hover:border-blue-200 transition">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-3">
                  02
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1.5 flex items-center gap-2">
                  คุณสมบัติการนำไฟฟ้าของน้ำลาดกระบัง
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  น้ำฝนบริสุทธิ์ไม่นำไฟฟ้า แต่น้ำท่วมขังอุดมไปด้วยแคลเซียม ดินตะกอน ขยะเปียก และเศษปลั๊กพ่วง ทำให้มีสภาพการนำกระแสไฟฟ้าดีกว่าทองแดงบริสุทธิ์ 12 เท่า
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 hover:border-amber-200 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-3">
                  03
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1.5 flex items-center gap-2">
                  ทฤษฎีการตรวจจับด้วยสายชาร์จ
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  พอร์ต Type-C มี 24 พิน หากมีไฟฟ้า 220V รั่วไหลในน้ำ พิน VBUS จะรับไอออนอิสระเข้าสู่วงจรชาร์จแบตเตอรี่ ทำให้โทรศัพท์เริ่มชาร์จไฟอัตโนมัติอย่างน่าอัศจรรย์
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 hover:border-purple-200 transition">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-3">
                  04
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1.5 flex items-center gap-2">
                  สูตรสมการไฮโดร-อิเล็กทริก
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 font-mono leading-relaxed bg-white/70 p-2 rounded-lg border border-purple-200">
                  V<sub>leak</sub> = (ความชื้น × ระดับน้ำ) ÷ สติสัมปชัญญะ
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  เมื่อ V<sub>leak</sub> &gt; 5V ระบบสมาร์ทโฟนจะทำหน้าที่เป็นโวลต์มิเตอร์พลีชีพ
                </p>
              </div>

            </div>

            {/* Official Academic Box */}
            <div className="border border-gray-200 bg-gray-50/80 rounded-2xl p-5 mb-8 flex items-start gap-4">
              <Info className="w-6 h-6 text-gray-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                <strong>คำแนะนำจากคณะวิจัย:</strong> ผู้ใช้งานควรศึกษาและทำความเข้าใจถึงความเสี่ยงก่อนดำเนินการ ทั้งนี้ หากอุปกรณ์ของท่านเริ่มมีควันขาวพวยพุ่งออกจากรูชาร์จ ให้ถอยห่างอย่างน้อย 3 ก้าว
              </div>
            </div>

            {/* Navigation Button */}
            <button 
              onClick={() => setActiveTab('prevent')}
              className="w-full py-4 bg-[#E35205] hover:bg-[#d04904] text-white font-bold rounded-2xl text-base shadow-lg hover:shadow-orange-600/30 transition flex items-center justify-center gap-2"
            >
              <span>รับทราบหลักวิชาการ และไปยังขั้นตอน "การป้องกันไฟฟ้า"</span>
              <span className="text-xl">&rarr;</span>
            </button>
          </div>
        )}

        {/* ----------------- STAGE 2: การป้องกันไฟฟ้า (Pre-hazard Safety) ----------------- */}
        {activeTab === 'prevent' && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 sm:p-10 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#E35205] tracking-widest uppercase">STAGE 2 : SAFETY PROTOCOL</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <ShieldAlert className="w-6 h-6 text-[#E35205]" />
                  มาตรการป้องกันกระแสไฟฟ้ารั่วและการยินยอมความเสี่ยง
                </h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
                ต้องทำตามระเบียบ
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
              ก่อนเริ่มกระบวนการสุ่มตรวจวัดไฟรั่วด้วยสายชาร์จ กรุณาตรวจสอบมาตรการด้านความปลอดภัยในอาคารของท่านอย่างเคร่งครัดตามรายการด้านล่างนี้:
            </p>

            <div className="space-y-4 mb-8">
              
              {/* Checklist 1: Cut breaker */}
              <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={breakerChecked} 
                  onChange={(e) => setBreakerChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#E35205] rounded cursor-pointer" 
                />
                <div>
                  <span className="font-semibold text-gray-800 text-sm block">
                    สับคัตเอาต์ / เบรกเกอร์หลักลง
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    (ทำเฉพาะกรณีที่ตู้เบรกเกอร์ยังไม่จมน้ำเท่านั้น หากตู้จมน้ำอยู่แล้ว ห้ามแตะต้องเด็ดขาด ให้เตรียมวิ่งขึ้นชั้นสอง)
                  </span>
                </div>
              </label>

              {/* Checklist 2: Unplug appliances */}
              <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={unplugChecked} 
                  onChange={(e) => setUnplugChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#E35205] rounded cursor-pointer" 
                />
                <div>
                  <span className="font-semibold text-gray-800 text-sm block">
                    ถอดปลั๊กเครื่องใช้ไฟฟ้าและปลั๊กพ่วงทุกจุด
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    โดยเฉพาะพัดลมตั้งพื้นที่วางอยู่บนพื้นเปียก และปลั๊กสามตาที่กำลังลอยน้ำอยู่เหมือนกระทง
                  </span>
                </div>
              </label>

              {/* Checklist 3: Rubber boots */}
              <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rubberBootsChecked} 
                  onChange={(e) => setRubberBootsChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#E35205] rounded cursor-pointer" 
                />
                <div>
                  <span className="font-semibold text-gray-800 text-sm block">
                    สวมรองเท้าบูทยางหรือยืนบนกะละมังฉนวน
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    เพิ่มความต้านทานไฟฟ้าทางผิวหนังตามหลักไบโอฟิสิกส์ เพื่อให้กระแสไฟเลือกไหลลงสู่สายชาร์จแทนร่างกายมนุษย์
                  </span>
                </div>
              </label>

              {/* MANDATORY DISCLAIMER CHECKBOX */}
              <div className={`p-4 rounded-2xl border-2 transition ${
                showConsentWarning && !phoneFuseConsent
                  ? 'border-red-500 bg-red-50/70 animate-shake'
                  : phoneFuseConsent
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-[#E35205] bg-orange-50/50'
              }`}>
                <label className="flex items-start gap-3.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={phoneFuseConsent} 
                    onChange={(e) => {
                      setPhoneFuseConsent(e.target.checked);
                      if (e.target.checked) setShowConsentWarning(false);
                    }}
                    className="mt-1 w-5 h-5 accent-[#E35205] rounded cursor-pointer shrink-0" 
                  />
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">
                      [ข้อบังคับสำคัญ] ฉันยินยอมใช้สมาร์ทโฟนเป็นฟิวส์ตรวจกระแสไฟฟ้าตามหลักวิทยาศาสตร์
                    </span>
                    <span className="text-xs text-gray-600 block mt-1 leading-relaxed">
                      ข้าพเจ้ารับทราบว่าโครงการ HydroCharge Sentinel นี้เป็นซอฟต์แวร์จำลองเชิงเสียดสี (The Stupid Hackathon Thailand) และหากนำสายชาร์จไปจุ่มน้ำจริง โทรศัพท์อาจลัดวงจรและหมดประกันโดยสมบูรณ์
                    </span>
                  </div>
                </label>
              </div>

            </div>

            {showConsentWarning && !phoneFuseConsent && (
              <div className="p-3 mb-6 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>กรุณาทำเครื่องหมายติ๊กถูกในช่องยินยอมสละสมาร์ทโฟนเป็นฟิวส์ก่อน จึงจะได้รับอนุญาตให้ไปต่อ</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setActiveTab('edu')}
                className="py-3.5 px-6 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-sm transition"
              >
                &larr; ย้อนกลับไปหน้าความรู้
              </button>

              <button 
                onClick={handleProceedToDetect}
                className="flex-1 py-4 bg-[#E35205] hover:bg-[#d04904] text-white font-bold rounded-2xl text-base shadow-lg hover:shadow-orange-600/30 transition flex items-center justify-center gap-2"
              >
                <span>เตรียมสายชาร์จพร้อมแล้ว ไปหน้าตรวจจับกระแสไฟ &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STAGE 3: เช็คไฟรั่ว (Main Detection Probe) ----------------- */}
        {activeTab === 'detect' && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 sm:p-10 transition-all">
            
            {/* Header of Stage 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-3">
              <div>
                <span className="text-xs font-bold text-[#E35205] tracking-widest uppercase">STAGE 3 : LIVE SENSOR PROBE</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <Zap className="w-6 h-6 text-[#E35205] fill-[#E35205]" />
                  เครื่องตรวจวัดสนามไฟฟ้ามวลน้ำ (HydroProbe Sentinel)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  อาศัยฮาร์ดแวร์เซ็นเซอร์ Battery API สากลเพื่อประมวลผลกระแสเหนี่ยวนำ
                </p>
              </div>

              {/* Dynamic Pill Status */}
              <div className={`self-start sm:self-center px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border ${
                isCharging 
                  ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-lg shadow-red-500/40' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isCharging ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
                {isCharging ? 'ตรวจพบกระแสไฟวิ่งเข้าเครื่อง! (อันตราย)' : 'สภาวะปกติ (ไม่พบไฟชาร์จ)'}
              </div>
            </div>

            {/* Realtime Hackathon Test Guide Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                <strong>วิธีสาธิตใน The Stupid Hackathon:</strong>
                <p className="mt-1 text-gray-700">
                  ตามทฤษฎีคือให้ <em>"จุ่มปลายสายชาร์จลงในน้ำท่วม"</em> แต่สำหรับการทดสอบบนเวที: 
                  <strong> เพียงแค่เสียบสายชาร์จโทรศัพท์เข้ากับพาวเวอร์แบงก์หรือเต้ารับ</strong> 
                  ระบบจะอ่านสถานะผ่าน <code className="bg-white/80 px-1.5 py-0.5 rounded text-amber-800 font-mono">navigator.getBattery()</code> แบบ Realtime ทันที!
                </p>
              </div>
            </div>

            {/* Hardware Status Display Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              
              {/* Card 1: Battery Level */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 text-center flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">ระดับแบตเตอรี่เครื่อง</span>
                <div className="my-2">
                  <span className="text-3xl font-black text-gray-900">{batteryLevel}</span>
                  <span className="text-base text-gray-500 font-semibold">%</span>
                </div>
                {/* Visual Battery Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      batteryLevel > 50 ? 'bg-emerald-500' : batteryLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${batteryLevel}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Port / Charging State */}
              <div className={`p-5 rounded-2xl border text-center flex flex-col justify-between transition-all ${
                isCharging 
                  ? 'bg-red-50/80 border-red-300 text-red-950' 
                  : 'bg-gray-50/80 border-gray-200 text-gray-800'
              }`}>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">สถานะอินเทอร์เฟซ USB</span>
                <div className="my-2 flex items-center justify-center gap-2">
                  {isCharging ? (
                    <Zap className="w-6 h-6 text-red-600 fill-red-600 animate-bounce" />
                  ) : (
                    <Waves className="w-6 h-6 text-gray-400" />
                  )}
                  <span className={`text-xl font-black ${isCharging ? 'text-red-600' : 'text-gray-700'}`}>
                    {isCharging ? 'CHARGING' : 'STANDBY'}
                  </span>
                </div>
                <span className={`text-[11px] font-medium ${isCharging ? 'text-red-700 font-bold' : 'text-gray-400'}`}>
                  {isCharging ? '⚡ มีประจุไฟฟ้าไหลเข้าโทรศัพท์' : 'ยังไม่พบกระแสไฟฟ้าเข้าสาย'}
                </span>
              </div>

              {/* Card 3: Browser API Status */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 text-center flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">โหมดการตรวจจับ</span>
                <div className="my-2">
                  <span className="text-sm font-bold text-gray-800 block">
                    {manualSimulationActive ? 'Manual Override (แล็บ)' : isSupported ? 'Native Battery API' : 'Safari/iOS Fallback'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {manualSimulationActive ? 'โหมดจำลองด้วยมือเปิดใช้งาน' : isSupported ? 'เชื่อมต่อระดับฮาร์ดแวร์สมบูรณ์' : 'ใช้ปุ่มจำลองด้านล่างได้'}
                  </span>
                </div>
                <span className="inline-block text-[10px] bg-gray-200/80 text-gray-700 px-2.5 py-0.5 rounded-full font-mono mx-auto">
                  {isSupported ? 'ACTIVE: 100%' : 'SIMULATOR ACTIVE'}
                </span>
              </div>

            </div>

            {/* DYNAMIC VOLTAGE READOUT & GAUGE SECTION */}
            <div className={`p-6 sm:p-8 rounded-3xl border-2 mb-8 transition-all relative overflow-hidden ${
              testedVoltage === 9999 || (isScanning && isCharging)
                ? 'bg-red-950 text-white border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse-glow'
                : testedVoltage === 0
                ? 'bg-emerald-950 text-white border-emerald-500 shadow-md'
                : 'bg-[#1A1A1A] text-white border-gray-800'
            }`}>
              
              {/* Scanline Grid Background */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '100% 4px'
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                
                <span className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">
                  KMITL HYDRO-VOLTMETER SPECTROGRAPHIC READOUT
                </span>

                {/* Main Readout Value */}
                {isScanning ? (
                  <div className="my-6">
                    <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-orange-400 animate-pulse">
                      {scanningLiveValue} V
                    </div>
                    <p className="text-xs text-orange-300 font-mono mt-2">
                      กำลังสแกนไอออนและสนามไฟฟ้า... {scanProgress}%
                    </p>
                    <div className="w-64 max-w-full bg-gray-800 rounded-full h-2 mt-3 mx-auto overflow-hidden">
                      <div 
                        className="bg-orange-500 h-full transition-all duration-150"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : testedVoltage === 9999 ? (
                  <div className="my-4 animate-shock-glitch">
                    <span className="inline-block bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 tracking-widest">
                      CRITICAL DANGER: 9999V DETECTED
                    </span>
                    <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                      9,999 V
                    </div>
                    <p className="text-sm sm:text-base text-red-200 font-semibold mt-2">
                      คำเตือน: น้ำท่วมมีไฟฟ้าแรงสูงไหลเวียนผ่านสายชาร์จ! กรุณายกขาลอยจากพื้นทันที!
                    </p>
                  </div>
                ) : testedVoltage === 0 ? (
                  <div className="my-4">
                    <span className="inline-block bg-emerald-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 tracking-widest">
                      NORMAL: SAFE ENVIRONMENT
                    </span>
                    <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-emerald-400">
                      0.00 V
                    </div>
                    <p className="text-sm sm:text-base text-emerald-200 font-medium mt-2">
                      ไม่พบกระแสไฟฟ้าไหลเข้าโทรศัพท์ หรือสายชาร์จยังไม่ได้สัมผัสน้ำ
                    </p>
                  </div>
                ) : (
                  <div className="my-6">
                    <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-gray-500">
                      ---.- V
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      กดปุ่มด้านล่างเพื่อเริ่มการสุ่มตรวจวัดกระแสไฟฟ้าในน้ำ
                    </p>
                  </div>
                )}

                {/* Sub Telemetry Bar */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8 border-t border-gray-800 pt-4 mt-4 w-full text-xs font-mono text-gray-400">
                  <div>ความถี่โครงข่าย: <span className="text-white font-bold">{isCharging ? '50.12 Hz' : '0.00 Hz'}</span></div>
                  <div>ความขุ่นของน้ำ: <span className="text-white font-bold">420 NTU (คลองลาดกระบัง)</span></div>
                  <div>เวลาตรวจวัดล่าสุด: <span className="text-white font-bold">{scanTimestamp || 'ยังไม่ได้ตรวจ'}</span></div>
                </div>

              </div>
            </div>

            {/* SCAN ACTION BUTTON */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleStartInspection}
                disabled={isScanning}
                className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl transition flex items-center justify-center gap-3 ${
                  isScanning 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isCharging
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-600/30'
                    : 'bg-[#E35205] hover:bg-[#d04904] text-white shadow-orange-600/30'
                }`}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>กำลังสแกนสเปกตรัมไฟฟ้าในของเหลว ({scanProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current" />
                    <span>เริ่มการตรวจสอบสเปกตรัมไฟฟ้าในของเหลว</span>
                  </>
                )}
              </button>

              {/* Next Stage Button */}
              {hasScannedOnce && (
                <button
                  onClick={() => setActiveTab('report')}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  <span>ดูบทวิเคราะห์ความปลอดภัย & โทรขอความช่วยเหลือ (Stage 4) &rarr;</span>
                </button>
              )}
            </div>

            {/* FALLBACK & LAB SIMULATOR ACCORDION */}
            <div className="border border-gray-200 bg-gray-50/70 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#E35205]" />
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    เครื่องมือจำลองในห้องแล็บ (Manual Simulation Override)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setManualSimulationActive(!manualSimulationActive);
                    if (!manualSimulationActive) {
                      setManualCharging(false);
                    }
                  }}
                  className={`text-xs px-3 py-1 rounded-full font-bold border transition ${
                    manualSimulationActive 
                      ? 'bg-[#E35205] text-white border-[#E35205]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {manualSimulationActive ? 'เปิดใช้งานอยู่' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                </button>
              </div>

              {manualSimulationActive && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                  <p className="text-xs text-gray-600">
                    สำหรับสาธิตบน Safari/iOS หรือเครื่องที่ไม่มีสายชาร์จ: จำลองสลับสถานะสายชาร์จได้ที่นี่:
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setManualCharging(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        manualCharging 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      จำลองเสียบสายชาร์จ (ไฟรั่ว!)
                    </button>
                    <button
                      onClick={() => setManualCharging(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        !manualCharging 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      จำลองถอดสาย (ปลอดภัย)
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------- STAGE 4: สรุปผล & ช่วยเหลือ (Emergency Action) ----------------- */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 sm:p-10 transition-all">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#E35205] tracking-widest uppercase">STAGE 4 : INCIDENT REPORT</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <FileText className="w-6 h-6 text-[#E35205]" />
                  สรุปผลการตรวจสอบ & มาตรการฉุกเฉิน
                </h3>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-mono">
                DOC-REF: KMITL-FLOOD-2569
              </span>
            </div>

            {/* Diagnostic Result Banner */}
            <div className={`p-6 sm:p-8 rounded-3xl border-2 mb-8 text-center transition-all ${
              isCharging || testedVoltage === 9999
                ? 'bg-red-50 border-red-300 text-red-950 shadow-lg shadow-red-100' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-lg shadow-emerald-100'
            }`}>
              <div className="inline-flex p-4 rounded-2xl mb-4 bg-white shadow-md border border-gray-100">
                {isCharging || testedVoltage === 9999 ? (
                  <Flame className="w-10 h-10 text-red-600 animate-bounce" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                )}
              </div>
              
              <h4 className="text-xl sm:text-2xl font-black">
                {isCharging || testedVoltage === 9999
                  ? 'คำเตือนขั้นวิกฤต: น้ำท่วมบริเวณนี้มีไฟรั่วแรงระดับชาร์จมือถือติด!' 
                  : 'ไม่พบกระแสไฟฟ้าไหลเข้าโทรศัพท์ (สภาวะปกติชั่วคราว)'}
              </h4>
              
              <p className="text-xs sm:text-sm text-gray-700 mt-2.5 max-w-lg mx-auto leading-relaxed">
                {isCharging || testedVoltage === 9999
                  ? 'ระบบตรวจวัดพบว่ากระแสไฟฟ้าจากมวลน้ำสามารถจ่ายไฟเข้าสู่แบตเตอรี่โทรศัพท์ของท่านได้สำเร็จ แปลว่าน้ำท่วมมีไฟรั่วแรงระดับ 220V กรุณายกขาลอยจากพื้นและห้ามสัมผัสราวบันไดเหล็ก'
                  : 'สายชาร์จของคุณยังไม่แสดงสถานะชาร์จ อาจจะเพราะน้ำไม่มีไฟรั่ว หรือสายชาร์จของท่านขาดในอยู่แล้ว แนะนำให้ตรวจสอบหัวชาร์จอีกครั้ง'}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  isCharging || testedVoltage === 9999
                    ? 'bg-red-200 text-red-800' 
                    : 'bg-emerald-200 text-emerald-800'
                }`}>
                  ระดับแรงดัน: {testedVoltage !== null ? `${testedVoltage} V` : isCharging ? '9,999 V' : '0 V'}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-white text-gray-700 border border-gray-200">
                  พอร์ตเชื่อมต่อ: USB Type-C HydroProbe
                </span>
              </div>
            </div>

            {/* MANDATORY EMERGENCY ACTION CARDS PER SPECIFICATIONS */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                มาตรการช่วยเหลือฉุกเฉินระดับเร่งด่วน:
              </h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* ACTION 1: Shopee Electrical Tape */}
                <a
                  href="https://shopee.co.th/search?keyword=เทปพันสายไฟ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-200 hover:border-[#E35205] hover:bg-orange-50/30 transition shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-orange-100 group-hover:bg-[#E35205] text-[#E35205] group-hover:text-white rounded-xl transition">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900 group-hover:text-[#E35205] transition flex items-center gap-1.5">
                        เรียกช่างซ่อมด่วน
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E35205]" />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        สั่งซื้อเทปพันสายไฟสีดำ (ม้วนละ 15 บาท) บน Shopee
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#E35205] font-bold group-hover:translate-x-1 transition shrink-0 ml-2">
                    สั่งซื้อทันที &rarr;
                  </span>
                </a>

                {/* ACTION 2: YouTube Funeral Chant */}
                <a
                  href="https://www.youtube.com/results?search_query=สวดพระอภิธรรม+7+คัมภีร์"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-5 rounded-2xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50/40 transition shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-red-100 group-hover:bg-red-600 text-red-600 group-hover:text-white rounded-xl transition">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-red-700 group-hover:text-red-800 transition flex items-center gap-1.5">
                        แจ้งเหตุกู้ภัยฉุกเฉิน
                        <ExternalLink className="w-3.5 h-3.5 text-red-400 group-hover:text-red-700" />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        เปิดฟังบทสวดพระอภิธรรม 7 คัมภีร์ (YouTube เพื่อความสงบใจ)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-red-600 font-bold group-hover:translate-x-1 transition shrink-0 ml-2">
                    เปิดฟังด่วน &rarr;
                  </span>
                </a>

              </div>
            </div>

            {/* Extra Features: Certificate & Re-probe */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              
              <button
                onClick={handleOpenCertificate}
                className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-gray-200"
              >
                <Award className="w-4 h-4 text-[#E35205]" />
                ออกใบรับรองผลการตรวจวัด (Official Certificate)
              </button>

              <button
                onClick={() => setActiveTab('detect')}
                className="py-3.5 px-6 bg-[#E35205] hover:bg-[#d04904] text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
              >
                <RefreshCw className="w-4 h-4" />
                กลับไปวัดค่าใหม่อีกรอบ
              </button>

            </div>

          </div>
        )}

      </main>

      {/* ================= OFFICIAL CERTIFICATE MODAL ================= */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-[#E35205] relative overflow-hidden">
            
            {/* Watermark Motif */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Zap className="w-72 h-72 text-[#E35205]" />
            </div>

            <div className="relative z-10 text-center">
              
              <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-[#E35205] mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-[#E35205]" />
              </div>

              <span className="text-[10px] font-mono tracking-widest uppercase bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                CERTIFICATE ID: {certificateData.id}
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                หนังสือรับรองการตรวจวัดประจุไฟฟ้าในมวลน้ำ
              </h3>
              <p className="text-xs text-gray-500 font-light mt-0.5">
                ออกโดย: ศูนย์วิจัยนวัตกรรมน้ำท่วมและการสละสมาร์ทโฟน KMITL
              </p>

              <div className="my-6 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ผลการตรวจวัด:</span>
                  <span className={`font-bold ${isCharging || testedVoltage === 9999 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {isCharging || testedVoltage === 9999 ? 'อันตราย (9,999V ไฟรั่วจริง)' : 'ปลอดภัย (0V)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ระดับแบตเตอรี่โทรศัพท์:</span>
                  <span className="font-bold text-gray-800">{batteryLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">สถานะประกันเครื่อง:</span>
                  <span className="font-bold text-red-500">สิ้นสุดความคุ้มครองทันที</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">วันที่ประทับตรา:</span>
                  <span className="font-mono text-gray-700">{certificateData.date}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 italic mb-6">
                "ใบรับรองนี้ใช้เพื่อความบันเทิงในงาน The Stupid Hackathon Thailand เท่านั้น ไม่สามารถใช้เคลมประกันภัยน้ำท่วมหรือประกันมือถือได้ทุกกรณี"
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์ใบรับรอง
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="py-3 px-5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 text-center mt-12 text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#E35205]" />
            <span className="font-bold text-gray-800">HydroCharge Sentinel</span>
            <span className="text-gray-400">• The Stupid Hackathon Thailand</span>
          </div>
          <p className="text-gray-400 text-[11px]">
            © 2569 KMITL Stupid Lab. All Rights Reserved (except your smartphone warranty).
          </p>
        </div>
      </footer>

    </div>
  );
}