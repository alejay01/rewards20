import React, { useEffect, useState } from "react";
import axios from "axios";
import { Flame, RefreshCw, Sparkles, MessageSquare, Instagram, ExternalLink } from "lucide-react";

export const SpecialsPage: React.FC = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await axios.get("/api/promotions/active");
        setPromos(res.data);
      } catch (e) {
        console.error("Failed to load promotions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-brand-light">
        <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
        <span className="text-xs text-gray-500 mt-2 font-medium">Looking for active specials...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] px-4 py-6 bg-brand-light space-y-6">
      
      {/* Page Header */}
      <div>
        <p className="text-brand-red font-bold text-[10px] uppercase tracking-widest mb-1">Weekly Promos</p>
        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal">Smokehouse Specials</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Take advantage of exclusive events to rack up double points!
        </p>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {promos.map(p => (
          <div 
            key={p.id}
            className="glass-card relative overflow-hidden bg-brand-charcoal text-white rounded-3xl p-5 shadow-xl border border-white/5"
          >
            {p.doublePoints && (
              <div className="absolute top-3 right-3 bg-brand-red text-white text-[8px] font-black uppercase py-1 px-2.5 rounded-full flex items-center gap-1 shadow animate-pulse">
                <Sparkles className="w-3 h-3 fill-white/25" />
                <span>2X POINTS</span>
              </div>
            )}
            
            <div className="space-y-2 relative z-10">
              <h4 className="font-extrabold text-sm text-white pr-20 leading-snug">{p.title}</h4>
              <p className="text-[10px] text-gray-300 leading-normal">{p.description}</p>
              
              <div className="flex items-center gap-1.5 text-[9px] text-brand-red font-bold pt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping"></span>
                <span>Active Campaign</span>
              </div>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
            <span className="text-2xl">🔥</span>
            <p className="text-xs font-bold text-gray-400 mt-2">No active specials today. Check in soon!</p>
          </div>
        )}
      </div>

      {/* 2. Inactive Social Promotion Integrations placeholders */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider pl-1">
          Social Promotion Integrations
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Facebook Messenger */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center opacity-65 flex flex-col justify-between items-center shadow-sm">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500 mb-2">
              <MessageSquare className="w-5 h-5 fill-blue-500/10" />
            </div>
            <div>
              <p className="font-bold text-xs text-brand-charcoal">Messenger</p>
              <p className="text-[8px] text-gray-400 leading-snug mt-0.5">Auto check-in & rewards balance updates.</p>
            </div>
            <span className="text-[8px] font-extrabold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full mt-3">
              Coming later
            </span>
          </div>

          {/* Instagram */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center opacity-65 flex flex-col justify-between items-center shadow-sm">
            <div className="p-2.5 bg-pink-50 rounded-xl text-pink-500 mb-2">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-brand-charcoal">Instagram DM</p>
              <p className="text-[8px] text-gray-400 leading-snug mt-0.5">Claim secret promos via stories direct messages.</p>
            </div>
            <span className="text-[8px] font-extrabold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full mt-3">
              Coming later
            </span>
          </div>
        </div>
        
        <p className="text-[9px] text-gray-400 text-center font-medium">
          Note: Social integrations are not active in this MVP release.
        </p>
      </div>

    </div>
  );
};
