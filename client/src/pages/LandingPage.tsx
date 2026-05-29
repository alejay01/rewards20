import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Flame, QrCode, Award, ShieldAlert, Sparkles, Utensils, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleLoyverseCallback(code);
    }
  }, [searchParams]);

  const handleLoyverseCallback = async (code: string) => {
    setIsProcessing(true);
    setAuthStatus("loading");
    setMessage("Exchanging authorization code with Loyverse...");

    try {
      const res = await apiClient.post("/api/admin/integrations/loyverse/authorize-code", { code });
      setAuthStatus("success");
      setMessage(res.data.message || "Loyverse successfully authorized!");
      
      // Redirect to admin panel after 2 seconds
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (err: any) {
      setAuthStatus("error");
      setMessage(err.response?.data?.error || "Failed to exchange authorization code.");
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-brand-charcoal text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-brand-charcoal/50 border border-white/10 p-8 rounded-3xl shadow-2xl relative max-w-sm w-full">
          <Flame className="w-12 h-12 text-brand-red fill-brand-red mx-auto mb-4 animate-pulse" />
          
          <h2 className="text-2xl font-black mb-2 text-white">
            Loyverse Authorization
          </h2>
          
          <div className="my-6 flex flex-col items-center justify-center">
            {authStatus === "loading" && (
              <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
            )}
            {authStatus === "success" && (
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-xl font-bold animate-bounce">
                ✓
              </div>
            )}
            {authStatus === "error" && (
              <div className="w-12 h-12 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center border border-brand-red/30 text-xl font-bold">
                ✕
              </div>
            )}
          </div>

          <p className="text-xs text-gray-300 font-medium mb-4">
            {message}
          </p>

          {authStatus === "success" && (
            <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider animate-pulse">
              Returning to Admin Dashboard...
            </p>
          )}

          {authStatus === "error" && (
            <button
              onClick={() => {
                setIsProcessing(false);
                setAuthStatus("idle");
                navigate("/");
              }}
              className="mt-4 w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] flex flex-col justify-between pb-10 bg-white">
      {/* Hero Banner */}
      <div className="gradient-bg text-white px-6 py-12 text-center rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-red/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <div className="inline-flex p-3 rounded-full bg-brand-red/10 border border-brand-red/30 mb-4 animate-bounce">
            <Flame className="w-8 h-8 text-brand-red fill-brand-red" />
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            The Boudin Company
          </h1>
          <p className="text-brand-red font-bold text-lg uppercase tracking-widest mb-6">
            Boudin Boss Rewards
          </p>
          
          <p className="text-gray-300 text-sm max-w-xs mx-auto mb-8 font-medium italic">
            “Scan. Eat. Earn. Become a Boudin Boss.”
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link 
              to="/join" 
              className="gradient-red hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-red/30 btn-animate text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-white/20" />
              <span>Join the Club Now</span>
            </Link>
            
            <Link 
              to="/claim" 
              className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold py-3.5 px-6 rounded-2xl btn-animate text-center flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Claim Points from Receipt</span>
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-8">
        <h2 className="text-xl font-bold text-brand-charcoal text-center mb-6 flex items-center justify-center gap-2">
          <Utensils className="w-5 h-5 text-brand-red" />
          <span>Feast & Earn in 3 Steps</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/5 text-brand-red font-bold flex items-center justify-center text-lg mb-2 shadow-sm border border-brand-red/10">
              1
            </div>
            <p className="font-extrabold text-xs text-brand-charcoal mb-1">Scan QR</p>
            <p className="text-[10px] text-gray-500 leading-tight">Show staff your personal code when ordering.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/5 text-brand-gold font-bold flex items-center justify-center text-lg mb-2 shadow-sm border border-brand-gold/10">
              2
            </div>
            <p className="font-extrabold text-xs text-brand-charcoal mb-1">Eat Good</p>
            <p className="text-[10px] text-gray-500 leading-tight">Get 10 points per visit + 1 point per $1 spent!</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-lg mb-2 shadow-sm border border-emerald-100">
              3
            </div>
            <p className="font-extrabold text-xs text-brand-charcoal mb-1">Free Gumbo</p>
            <p className="text-[10px] text-gray-500 leading-tight">Redeem points for fresh boudin, drinks, or gear!</p>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="px-6">
        <div className="bg-brand-light rounded-3xl p-5 border border-gray-100">
          <h3 className="font-bold text-sm text-brand-charcoal mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-red" />
            <span>Boss Rewards Sneak Peek</span>
          </h3>
          
          <div className="space-y-2">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100/50 flex justify-between items-center">
              <div>
                <p className="font-bold text-xs">Free Hot Crispy Boudin Ball</p>
                <p className="text-[10px] text-gray-500">Unlocks after 10 visits</p>
              </div>
              <span className="text-[10px] font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">150 PTS</span>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100/50 flex justify-between items-center">
              <div>
                <p className="font-bold text-xs">VIP Smokehouse Legend Feast</p>
                <p className="text-[10px] text-gray-500">Spend $150 threshold reward</p>
              </div>
              <span className="text-[10px] font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">600 PTS</span>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100/50 flex justify-between items-center">
              <div>
                <p className="font-bold text-xs">Boudin Company Logo Tee</p>
                <p className="text-[10px] text-gray-500">Show off your Boss status</p>
              </div>
              <span className="text-[10px] font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">300 PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="px-6 mt-6 text-center">
        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
          <span>📍</span>
          <span>The Boudin Company • Rosenberg, Texas • Est. 2026</span>
        </p>
      </div>
    </div>
  );
};
