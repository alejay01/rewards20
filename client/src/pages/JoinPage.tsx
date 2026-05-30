import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Flame, Sparkles, User, Mail, Phone, Calendar, Heart, ShieldCheck, ArrowLeftRight } from "lucide-react";

export const JoinPage: React.FC = () => {
  const { joinCustomer, loginCustomer } = useAuth();
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favoriteCategory, setFavoriteCategory] = useState("Boudin Links");
  const [consentPromotions, setConsentPromotions] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Lookup state
  const [lookupValue, setLookupValue] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName) {
      setError("First and Last name are required.");
      return;
    }

    if (!email && !phone) {
      setError("You must provide either an Email address or Phone number to join.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service to join.");
      return;
    }

    try {
      await joinCustomer({
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        birthday: birthday || undefined,
        favoriteCategory: favoriteCategory || undefined,
        consentPromotions
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 1500);
    } catch (e: any) {
      setError(e.response?.data?.error || "Registration failed. Please check details.");
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lookupValue) {
      setError("Please enter your Email or Phone number.");
      return;
    }

    try {
      await loginCustomer(lookupValue);
      setSuccess(true);
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 1500);
    } catch (e: any) {
      setError(e.response?.data?.error || "Account lookup failed. Are you registered?");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] px-6 py-10 bg-white flex flex-col justify-center">
      <div className="text-center mb-8">
        <Flame className="w-10 h-10 text-brand-red fill-brand-red mx-auto mb-2" />
        <h2 className="text-2xl font-extrabold tracking-tight">
          {isLoginMode ? "Lookup Your Account" : "Become a Boudin Boss"}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isLoginMode 
            ? "Enter email or phone to open your mobile loyalty dashboard." 
            : "Sign up today to earn points, unlock spicy Cajun badges, and feast!"
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-brand-red text-xs rounded-xl p-3 mb-6 font-medium">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl p-3 mb-6 font-bold text-center">
          🎉 Success! Redirecting you to your Boss Dashboard...
        </div>
      )}

      {!isLoginMode ? (
        // 1. JOIN CLUB FORM
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">First Name *</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Boudreaux"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red"
                  required
                />
                <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Last Name *</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Thibodeaux"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red"
              />
              <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Phone Number (No SMS)</label>
            <div className="relative">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="281-555-0199"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red"
              />
              <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">Used strictly for cashier counter lookups. We never send SMS.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Birthday (Optional)</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red"
                />
                <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Favorite Item</label>
              <div className="relative">
                <select 
                  value={favoriteCategory}
                  onChange={(e) => setFavoriteCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red appearance-none"
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

          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer">
              <input 
                type="checkbox" 
                checked={consentPromotions}
                onChange={(e) => setConsentPromotions(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
              />
              <span>I consent to receiving occasional promotions through future social channels (Facebook Messenger, Instagram).</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                required
              />
              <span>I agree to The Boudin Company Rewards Terms & Privacy Policy.</span>
            </label>
          </div>

          <button 
            type="submit"
            className="w-full gradient-red hover:opacity-95 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand-red/20 btn-animate text-xs mt-4 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-white/10" />
            <span>Create Loyalty Account</span>
          </button>
        </form>
      ) : (
        // 2. ACCOUNT LOOKUP FORM
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Email or Phone Number</label>
            <div className="relative">
              <input 
                type="text" 
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                placeholder="Enter email or phone number..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 pl-9 text-xs font-bold focus:outline-none focus:border-brand-red"
                required
              />
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">E.g., <code>boudreaux@bayou.com</code> or <code>281-555-0101</code></p>
          </div>

          <button 
            type="submit"
            className="w-full gradient-bg hover:opacity-95 text-white font-bold py-3 px-6 rounded-2xl shadow-lg btn-animate text-xs mt-4"
          >
            Open Dashboard
          </button>
        </form>
      )}

      {/* Cajun Loyalty Program Rules card */}
      <div className="bg-brand-charcoal text-white rounded-3xl p-5 border border-brand-red/20 shadow-xl space-y-3 mt-6">
        <h4 className="font-extrabold text-xs text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-brand-red fill-brand-red" />
          <span>Official Loyalty Program Rules</span>
        </h4>
        
        <ul className="text-[10px] space-y-2 text-gray-300 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-brand-gold">🔸</span>
            <span><strong>One Visit Per Day:</strong> Guests may log exactly one visit check-in per day per account to earn standard points.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-gold">🔸</span>
            <span><strong>One Transaction Per Day:</strong> Points are awarded for a maximum of one transaction purchase total per day per account.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-gold">🔸</span>
            <span><strong>Auto Sign-Up Gift:</strong> Instantly unlock a <strong>Free Boudin Ball (150 PTS)</strong> loaded directly to your card upon registration!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-gold">🔸</span>
            <span><strong>Spicy Cajun Perks:</strong> Spend points to redeem fresh hot links, cold drinks, side dishes, and exclusive Boudin Boss custom merchandise.</span>
          </li>
        </ul>
      </div>

      {/* Switch Modes */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <button 
          onClick={() => {
            setError(null);
            setIsLoginMode(!isLoginMode);
          }}
          className="text-xs font-bold text-brand-red hover:underline flex items-center justify-center gap-1.5 mx-auto"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>{isLoginMode ? "Create New Loyalty Profile" : "Lookup Existing Account"}</span>
        </button>
      </div>
    </div>
  );
};
