import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Flame, ShieldAlert, Key, Mail, RefreshCw } from "lucide-react";

export const StaffLoginPage: React.FC = () => {
  const { loginStaff } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] px-6 py-10 bg-brand-light flex flex-col justify-center">
      
      <div className="text-center mb-8">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-brand-red text-xs rounded-2xl p-4 mb-6 font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
        <div>
          <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Store Email</label>
          <div className="relative">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@theboudincompany.com"
              className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2.5 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
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
              className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2.5 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
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

      {/* Demo Credentials note */}
      <div className="mt-8 p-4 bg-brand-charcoal text-white rounded-2xl shadow-inner border border-white/5 space-y-2">
        <p className="text-[10px] font-black uppercase text-brand-red tracking-wider">Demo Access Logins:</p>
        <div className="text-[9px] font-mono space-y-1 text-gray-300">
          <p>• Admin: <code className="text-white">admin@theboudincompany.com</code></p>
          <p>• Manager: <code className="text-white">manager@theboudincompany.com</code></p>
          <p>• Team Member: <code className="text-white">team@theboudincompany.com</code></p>
          <p>• Password for all: <code className="text-white font-bold">BoudinBoss2026!</code></p>
        </div>
      </div>

    </div>
  );
};
