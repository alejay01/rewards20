import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Flame, ShieldAlert, Key, Mail, RefreshCw } from "lucide-react";

export const StaffLoginPage: React.FC = () => {
  const { loginStaff, loginStaffWithPin } = useAuth();
  const navigate = useNavigate();

  // Tab state: PIN vs Email mode
  const [isPinMode, setIsPinMode] = useState(false);

  // Email form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // PIN form states
  const [pin, setPin] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-submit PIN login when it reaches 4 digits
  useEffect(() => {
    if (isPinMode && pin.length === 4) {
      handlePinLogin();
    }
  }, [pin, isPinMode]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginStaff(email, password);
      const role = data.user?.role;

      if (role === "Administrator") {
        navigate("/admin");
      } else {
        navigate("/tablet");
      }
    } catch (e: any) {
      setError(e.response?.data?.error || "Login failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) return;
    setLoading(true);
    setError(null);

    try {
      const data = await loginStaffWithPin(pin);
      const role = data.user?.role;

      if (role === "Administrator") {
        navigate("/admin");
      } else {
        navigate("/tablet");
      }
    } catch (e: any) {
      setError(e.response?.data?.error || "Invalid PIN code. Please try again.");
      setPin(""); // Reset PIN on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] px-6 py-10 bg-brand-light flex flex-col justify-center font-sans">
      
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-brand-charcoal border border-white/5 mb-3">
          <Flame className="w-8 h-8 text-brand-red fill-brand-red animate-pulse" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal">
          Staff Portal Login
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Authorized restaurant employee sign-in only.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-250 p-1 rounded-2xl mb-6 max-w-xs mx-auto border border-gray-300/40 w-full">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setIsPinMode(false);
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all active:scale-[0.98] ${
            !isPinMode ? "bg-white text-brand-charcoal shadow-md" : "text-gray-500 hover:text-brand-charcoal"
          }`}
        >
          Email & Password
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setIsPinMode(true);
            setError(null);
            setPin("");
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all active:scale-[0.98] ${
            isPinMode ? "bg-white text-brand-charcoal shadow-md" : "text-gray-500 hover:text-brand-charcoal"
          }`}
        >
          Quick PIN Lock
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-brand-red text-xs rounded-2xl p-4 mb-6 font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Forms */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xl">
        {!isPinMode ? (
          // 1. EMAIL/PASSWORD LOGIN FORM
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Store Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@theboudincompany.com"
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2.5 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                  required
                />
                <Mail className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Staff Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2.5 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                  required
                />
                <Key className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full gradient-red hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl shadow-md btn-animate text-xs mt-4 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Log In to Shift Portal</span>
              )}
            </button>
          </form>
        ) : (
          // 2. QUICK PIN LOGIN KEYPAD FORM
          <form onSubmit={handlePinLogin} className="space-y-6">
            <div className="text-center space-y-2">
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Enter Store PIN Code</label>
              
              {/* Dot Previews */}
              <div className="flex justify-center gap-4 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      pin.length > idx
                        ? "bg-brand-red border-brand-red scale-110 shadow-md shadow-brand-red/30"
                        : "bg-gray-100 border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tactical Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (pin.length < 4) {
                      setPin(pin + num);
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-brand-light hover:bg-gray-100 active:scale-95 text-lg font-black text-brand-charcoal flex items-center justify-center transition-all border border-gray-200"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={loading || pin.length === 0}
                onClick={() => setPin("")}
                className="w-14 h-14 rounded-full bg-red-50 hover:bg-red-100 active:scale-95 text-[10px] font-extrabold text-brand-red flex items-center justify-center transition-all border border-red-200/50"
              >
                CLEAR
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (pin.length < 4) {
                    setPin(pin + "0");
                  }
                }}
                className="w-14 h-14 rounded-full bg-brand-light hover:bg-gray-100 active:scale-95 text-lg font-black text-brand-charcoal flex items-center justify-center transition-all border border-gray-200"
              >
                0
              </button>
              <button
                type="button"
                disabled={loading || pin.length === 0}
                onClick={() => setPin(pin.slice(0, -1))}
                className="w-14 h-14 rounded-full bg-brand-light hover:bg-gray-100 active:scale-[0.9] text-sm font-black text-brand-charcoal flex items-center justify-center transition-all border border-gray-200 font-mono"
              >
                ⌫
              </button>
            </div>

            {loading && (
              <div className="flex justify-center items-center gap-1.5 text-xs text-gray-400 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking PIN authorization...</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Demo Credentials note */}
      <div className="mt-8 p-4 bg-brand-charcoal text-white rounded-2xl shadow-inner border border-white/5 space-y-2">
        <p className="text-[10px] font-black uppercase text-brand-red tracking-wider">Demo Access Logins & PINs:</p>
        <div className="text-[9px] font-mono space-y-1 text-gray-300">
          <p>• Admin: <code className="text-white">admin@theboudincompany.com</code> (PIN: <code className="text-brand-gold font-bold">1234</code>)</p>
          <p>• Manager: <code className="text-white">manager@theboudincompany.com</code> (PIN: <code className="text-brand-gold font-bold">1234</code>)</p>
          <p>• Team Member: <code className="text-white">team@theboudincompany.com</code> (PIN: <code className="text-brand-gold font-bold">None</code>)</p>
          <p>• Password for all: <code className="text-white font-bold">BoudinBoss2026!</code></p>
        </div>
      </div>

    </div>
  );
};
