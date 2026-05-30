import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, Calendar, Heart, ShieldCheck, RefreshCw } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { customerUser, refreshCustomer, apiClient } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favoriteCategory, setFavoriteCategory] = useState("Boudin Links");
  const [consentPromotions, setConsentPromotions] = useState(false);

  useEffect(() => {
    if (customerUser?.customer) {
      const c = customerUser.customer;
      setFirstName(c.firstName || "");
      setLastName(c.lastName || "");
      setBirthday(c.birthday ? c.birthday.split("T")[0] : "");
      setFavoriteCategory(c.favoriteCategory || "Boudin Links");
      setConsentPromotions(c.consentPromotions || false);
    }
  }, [customerUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await apiClient.patch("/api/customers/me", {
        firstName,
        lastName,
        birthday: birthday || undefined,
        favoriteCategory,
        consentPromotions
      });
      await refreshCustomer();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!customerUser) return null;

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] px-4 py-6 bg-brand-light space-y-6">
      
      {/* Page Header */}
      <div>
        <p className="text-brand-red font-bold text-[10px] uppercase tracking-widest mb-1">My Account</p>
        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal">Edit Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Keep your contact preferences and details fresh!
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl p-3 font-bold text-center">
          🎉 Profile settings saved successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-brand-red text-xs rounded-xl p-3 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 shadow-md border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">First Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
                required
              />
              <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Last Name</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red"
              required
            />
          </div>
        </div>

        {/* Read-only contact columns (cannot change primary login keys) */}
        <div>
          <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Email (Read Only)</label>
          <div className="relative opacity-60">
            <input 
              type="text" 
              value={customerUser.customer.email || "Not Provided"}
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium cursor-not-allowed"
            />
            <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Phone Number (Read Only)</label>
          <div className="relative opacity-60">
            <input 
              type="text" 
              value={customerUser.customer.phone || "Not Provided"}
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium cursor-not-allowed"
            />
            <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Birthday</label>
            <div className="relative">
              <input 
                type="date" 
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
              />
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Favorite Item</label>
            <div className="relative">
              <select 
                value={favoriteCategory}
                onChange={(e) => setFavoriteCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-155 rounded-xl py-2.5 px-3 pl-8 text-[11px] font-black focus:outline-none focus:border-brand-red appearance-none"
              >
                <option>Boudin Links</option>
                <option>Boudin Balls</option>
                <option>Smoked Ribs</option>
                <option>Gumbo</option>
                <option>Tea Cakes</option>
              </select>
              <Heart className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-[11px] text-gray-600 font-bold cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={consentPromotions}
              onChange={(e) => setConsentPromotions(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
            />
            <span>I consent to receiving promotional alerts on Facebook Messenger and Instagram when channels connect.</span>
          </label>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full gradient-red hover:opacity-95 text-white font-bold py-3 px-6 rounded-2xl shadow-md btn-animate text-xs mt-4 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{loading ? "Saving Changes..." : "Save Profile Details"}</span>
        </button>
      </form>
    </div>
  );
};
