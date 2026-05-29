import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, QrCode, Award, Zap, User, Flame } from "lucide-react";

export const Header: React.FC = () => {
  const { customerUser, logoutCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutCustomer();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-brand-charcoal text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand */}
        <Link to={customerUser ? "/app/dashboard" : "/"} className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-brand-red fill-brand-red animate-pulse" />
          <span className="font-extrabold text-lg tracking-wider text-white">
            BOUDIN <span className="text-brand-red">BOSS</span>
          </span>
        </Link>

        {/* Customer Balance or Actions */}
        {customerUser ? (
          <div className="flex items-center gap-4">
            <Link 
              to="/app/dashboard" 
              className="bg-brand-red/10 border border-brand-red/30 px-3 py-1 rounded-full text-xs font-bold text-brand-red flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-brand-red" />
              <span>{customerUser.loyalty.pointsBalance} PTS</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link 
            to="/join" 
            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs px-4 py-2 rounded-full transition-all duration-300 active:scale-95 shadow-md shadow-brand-red/20"
          >
            Join Club
          </Link>
        )}
      </div>

      {/* Mobile Navigation Tabs for logged in Customer */}
      {customerUser && (
        <nav className="bg-brand-charcoal/95 border-t border-white/5 max-w-md mx-auto flex justify-around py-2">
          <Link 
            to="/app/dashboard" 
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold tracking-wide transition-colors ${
              isActive("/app/dashboard") ? "text-brand-red" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/app/my-qr" 
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold tracking-wide transition-colors ${
              isActive("/app/my-qr") ? "text-brand-red" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>My QR</span>
          </Link>

          <Link 
            to="/app/rewards" 
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold tracking-wide transition-colors ${
              isActive("/app/rewards") ? "text-brand-red" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Rewards</span>
          </Link>

          <Link 
            to="/app/specials" 
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold tracking-wide transition-colors ${
              isActive("/app/specials") ? "text-brand-red" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Specials</span>
          </Link>

          <Link 
            to="/app/profile" 
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold tracking-wide transition-colors ${
              isActive("/app/profile") ? "text-brand-red" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </nav>
      )}
    </header>
  );
};
