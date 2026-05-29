import React, { useEffect, useState } from "react";
import axios from "axios";
import { Zap, Award, Flame, RefreshCw, Lock, Sparkles, CheckCircle2 } from "lucide-react";

export const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "points" | "visit" | "spend">("all");

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await axios.get("/api/customers/me/rewards");
        setRewards(res.data);
      } catch (e) {
        console.error("Failed to load rewards:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const filtered = rewards.filter(r => filterType === "all" || r.rewardType === filterType);

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-brand-light">
        <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
        <span className="text-xs text-gray-500 mt-2 font-medium">Loading our smokehouse rewards...</span>
      </div>
    );
  }

  const getRewardIcon = (type: string) => {
    if (type === "visit") return <Award className="w-5 h-5 text-brand-gold fill-brand-gold/10" />;
    if (type === "spend") return <Flame className="w-5 h-5 text-brand-red fill-brand-red/10" />;
    return <Zap className="w-5 h-5 text-blue-500 fill-blue-500/10" />;
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] px-4 py-6 bg-brand-light space-y-6">
      
      {/* Page Header */}
      <div>
        <p className="text-brand-red font-bold text-[10px] uppercase tracking-widest mb-1">Earn & Claim</p>
        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal">Boss Rewards</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Scan your QR at the counter to redeem your unlocked rewards!
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-inner border border-gray-100">
        {(["all", "points", "visit", "spend"] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-1 py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
              filterType === type 
                ? "bg-brand-charcoal text-white shadow-sm" 
                : "text-gray-400 hover:text-brand-charcoal"
            }`}
          >
            {type === "all" ? "All" : type}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div 
            key={r.id}
            className={`glass-card p-4 relative overflow-hidden transition-all duration-300 ${
              r.isLocked ? "opacity-75" : "border-emerald-200 bg-emerald-50/10"
            }`}
          >
            <div className="flex gap-3 items-start relative z-10">
              <div className={`p-2.5 rounded-xl ${r.isLocked ? "bg-gray-50 text-gray-400" : "bg-emerald-50 text-emerald-600"}`}>
                {r.isLocked ? <Lock className="w-5 h-5" /> : getRewardIcon(r.rewardType)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-xs text-brand-charcoal pr-4 leading-snug">{r.name}</h4>
                  
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    r.isLocked 
                      ? "bg-gray-100 text-gray-400" 
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {r.rewardType === "visit" && `${r.visitsRequired} Visits`}
                    {r.rewardType === "spend" && `$${parseFloat(r.spendRequired).toFixed(0)} Spend`}
                    {r.rewardType === "points" && `${r.pointsRequired} Points`}
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-500 leading-normal">{r.description}</p>

                {/* Progress bar */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between text-[9px] font-bold text-gray-400">
                    <span>Unlock Progress</span>
                    <span>{r.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        r.isLocked ? "bg-brand-red" : "bg-emerald-500"
                      }`} 
                      style={{ width: `${r.progress}%` }}
                    ></div>
                  </div>
                </div>

                {!r.isLocked && (
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 pt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked! Show QR code to staff to claim this item.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
            <span className="text-2xl">🍢</span>
            <p className="text-xs font-bold text-gray-400 mt-2">No rewards found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
