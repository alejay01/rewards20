import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, Award, Flame, Calendar, Clock, Sparkles, ChevronRight, QrCode, RefreshCw } from "lucide-react";
import canvasConfetti from "canvas-confetti";

export const DashboardPage: React.FC = () => {
  const { customerUser, refreshCustomer, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!customerUser) {
      navigate("/join");
      return;
    }

    // PWA Install handler
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Check if running in standalone PWA mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [customerUser, navigate]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
      
      // Fire confetti celebration!
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-brand-light">
        <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
        <span className="text-xs text-gray-500 mt-2 font-medium">Verifying rewards membership...</span>
      </div>
    );
  }

  if (!customerUser) return null;

  const { customer, loyalty } = customerUser;

  // Cajun Greetings based on time
  const getCajunGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Bonjour, Welcome back!";
    if (hours < 17) return "Welcome back, Boss!";
    return "Bonsoir, Ready for dinner?";
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] px-4 py-6 space-y-6 bg-brand-light">
      
      {/* 1. Welcoming Hero Card */}
      <div className="gradient-bg text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Flame className="w-36 h-36 text-brand-red fill-brand-red" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-brand-red font-bold text-[10px] uppercase tracking-wider mb-1">Cajun Loyalty Club</p>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {getCajunGreeting()}
            </h2>
            <p className="text-gray-300 text-xs font-medium mt-0.5">{customer.firstName} {customer.lastName}</p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 flex-1 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-wide">Points Balance</span>
              <span className="text-2xl font-black text-white flex items-center gap-1 mt-1">
                <Zap className="w-5 h-5 text-brand-red fill-brand-red" />
                {loyalty.pointsBalance}
              </span>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 flex-1 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-wide">Visits</span>
              <span className="text-2xl font-black text-white flex items-center gap-1 mt-1">
                <Award className="w-5 h-5 text-brand-gold fill-brand-gold" />
                {loyalty.totalVisits}
              </span>
            </div>
          </div>

          <Link 
            to="/app/my-qr" 
            className="w-full gradient-red hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 btn-animate shadow-md"
          >
            <QrCode className="w-4 h-4" />
            <span>Show My QR Code</span>
          </Link>
        </div>
      </div>

      {/* 2. PWA Install Prompt */}
      {installPrompt && !isInstalled && (
        <div className="bg-brand-red/5 border border-brand-red/10 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div className="space-y-1">
            <p className="font-extrabold text-xs text-brand-charcoal">Install Boudin Rewards</p>
            <p className="text-[10px] text-gray-500">Access your rewards QR in one click from your home screen!</p>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-brand-red text-white text-[10px] font-bold px-3 py-1.5 rounded-lg btn-animate shadow-sm"
          >
            Install
          </button>
        </div>
      )}

      {/* 3. Tier & Gamified Progress */}
      {loyalty.currentTier && (
        <div className="glass-card p-5">
          <div className="flex gap-4 items-center mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg border border-white/15 flex items-center justify-center text-2xl shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-brand-charcoal">{loyalty.currentTier.name}</span>
                <span className="text-[9px] font-extrabold bg-brand-gold/10 text-brand-gold border border-brand-gold/25 px-1.5 py-0.5 rounded">CURRENT</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{loyalty.currentTier.description}</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {loyalty.nextTier ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                <span>Next: {loyalty.nextTier.name}</span>
                <span>{loyalty.totalVisits} / {loyalty.nextTier.visitsRequired} Visits</span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="gradient-red h-full rounded-full transition-all duration-500" 
                  style={{ width: `${loyalty.nextTier.progress}%` }}
                ></div>
              </div>
              
              <p className="text-[10px] text-gray-400 font-medium">
                “Just {loyalty.nextTier.visitsRequired - loyalty.totalVisits} more visits to unlock {loyalty.nextTier.name}!”
              </p>
            </div>
          ) : (
            <div className="bg-brand-gold/5 border border-brand-gold/15 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-brand-gold">🎉 You are officially a VIP Smokehouse Legend!</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Specials Panel Link */}
      <div className="glass-card p-4 flex justify-between items-center border-l-4 border-l-brand-red cursor-pointer hover:bg-gray-50 transition-all">
        <Link to="/app/specials" className="flex items-center gap-3 w-full">
          <div className="p-2 rounded-xl bg-brand-red/5">
            <Flame className="w-5 h-5 text-brand-red fill-brand-red" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-xs text-brand-charcoal">Specials & Active Promotions</p>
            <p className="text-[10px] text-gray-500">Check out Double Points days and weekend events!</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider pl-1">Recent Activity</h3>
        
        <div className="glass-card divide-y divide-gray-50">
          <Link to="/app/profile" className="block text-center py-4 text-xs font-bold text-brand-red hover:underline">
            Manage Profile Settings
          </Link>
        </div>
      </div>
    </div>
  );
};
