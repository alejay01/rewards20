import React from "react";
import { Link } from "react-router-dom";
import { WifiOff, Flame, RefreshCw } from "lucide-react";

export const OfflinePage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] px-6 bg-white flex flex-col justify-center items-center text-center space-y-6">
      
      <div className="p-4 bg-brand-red/5 rounded-3xl text-brand-red border border-brand-red/10 animate-pulse">
        <WifiOff className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-brand-charcoal">Internet Lost, Mon Ami!</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          The bayou winds must have taken your signal! Boudin Boss loyalty check-ins and active promotions require an internet connection to sync.
        </p>
      </div>

      <div className="bg-brand-light p-4 rounded-2xl border border-gray-100 max-w-xs text-left">
        <p className="text-[10px] font-extrabold uppercase text-brand-charcoal mb-1 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-brand-red fill-brand-red" />
          <span>App Shell Offline Mode</span>
        </p>
        <p className="text-[10px] text-gray-500 leading-normal">
          Don't worry, the app is still installed. Once you reconnect to the network, your balances, points updates, and available reward vouchers will automatically reload!
        </p>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="gradient-red text-white text-xs font-bold py-3 px-6 rounded-2xl shadow-md btn-animate flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Reconnecting</span>
      </button>

      <p className="text-[9px] text-gray-400">
        The Boudin Company • Rosenberg, Texas
      </p>
    </div>
  );
};
