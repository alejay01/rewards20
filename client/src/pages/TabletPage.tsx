import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Scan, Search, PlusCircle, CheckCircle, Award, 
  Flame, Zap, AlertTriangle, Key, LogOut, RefreshCw, X, ShieldAlert,
  Clock
} from "lucide-react";
import canvasConfetti from "canvas-confetti";
import { Html5QrcodeScanner } from "html5-qrcode";

export const TabletPage: React.FC = () => {
  const { staffUser, logoutStaff, apiClient } = useAuth();
  const navigate = useNavigate();

  // Authentication gate
  useEffect(() => {
    if (!staffUser) {
      navigate("/staff/login");
    }
  }, [staffUser, navigate]);

  // Main UI states
  const [activeTab, setActiveTab] = useState<"scan" | "search" | "customer" | "activity">("scan");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [recentTabletLogs, setRecentTabletLogs] = useState<any[]>([]);

  // Action Panel states
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  // Security Override Modal states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePin, setOverridePin] = useState("");
  const [overrideAction, setOverrideAction] = useState<any>(null); // { type: 'visit' | 'redeem', data?: any }
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Scanner UI states
  const [showScanner, setShowScanner] = useState(false);
  const [tokenInput, setTokenInput] = useState(""); // Help testers type demo tokens directly!

  useEffect(() => {
    if (staffUser) {
      fetchRecentActivity();
    }
  }, [staffUser]);

  const fetchRecentActivity = async () => {
    try {
      const res = await apiClient.get("/api/tablet/recent-activity");
      setRecentTabletLogs(res.data);
    } catch (e) {
      console.error("Failed to load tablet activity:", e);
    }
  };

  // QR Scanning Scanner initialization
  useEffect(() => {
    let scanner: any = null;

    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText: string) => {
          scanner.clear();
          setShowScanner(false);
          await handleQrLookup(decodedText);
        },
        (error: any) => {
          // silent camera error logs
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e: any) => console.error("Error clearing scanner", e));
      }
    };
  }, [showScanner]);

  const handleQrLookup = async (token: string) => {
    setErrorState(null);
    setActionLoading(true);
    try {
      const res = await apiClient.get(`/api/tablet/customer/${token}`);
      setSelectedCustomer(res.data);
      setActiveTab("customer");
    } catch (e: any) {
      setErrorState(e.response?.data?.error || "Customer QR not found or expired.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setErrorState(null);
    setActionLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/customers?search=${searchQuery}`);
      setSearchResults(res.data);
    } catch (e: any) {
      setErrorState("Search failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectCustomerFromSearch = async (cust: any) => {
    // Search endpoint returns shallow info. Lookup full tablet details by customer QR token
    await handleQrLookup(cust.publicQrToken);
  };

  // State errors
  const [errorState, setErrorState] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<string | null>(null);

  // 1. Action: Add Visit (qualified check-in)
  const handleAddVisit = async (bypassPin?: string) => {
    if (!selectedCustomer) return;
    setErrorState(null);
    setSuccessState(null);
    setActionLoading(true);

    try {
      const res = await apiClient.post("/api/tablet/add-visit", {
        customerId: selectedCustomer.customer.id,
        pinOverride: bypassPin
      });

      setSuccessState(res.data.message);
      
      // Celebrate tier unlock!
      if (res.data.tierUnlocked) {
        canvasConfetti({ particleCount: 150, spread: 80 });
      }

      // Reload customer
      await handleQrLookup(selectedCustomer.loyalty.publicQrToken);
      fetchRecentActivity();
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.error === "DUPLICATE_VISIT") {
        // Trigger PIN Modal
        setOverrideAction({ type: "visit" });
        setOverrideMessage("Duplicate visit detected. Enter Manager/Admin PIN to log another check-in today.");
        setShowOverrideModal(true);
      } else {
        setErrorState(e.response?.data?.error || "Failed to log visit.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Action: Add Purchase Total
  const handleAddPurchase = async (e?: React.FormEvent, bypassPin?: string) => {
    if (e) e.preventDefault();
    if (!selectedCustomer || !purchaseAmount) return;
    setErrorState(null);
    setSuccessState(null);
    setActionLoading(true);

    try {
      const res = await apiClient.post("/api/tablet/add-purchase", {
        customerId: selectedCustomer.customer.id,
        amount: purchaseAmount,
        receiptNumber: receiptNumber || undefined,
        pinOverride: bypassPin
      });

      setSuccessState(`Success: Credited $${parseFloat(purchaseAmount).toFixed(2)}. Awarded ${res.data.pointsAwarded} points!`);
      
      if (res.data.tierUnlocked) {
        canvasConfetti({ particleCount: 150, spread: 80 });
      }

      setPurchaseAmount("");
      setReceiptNumber("");
      await handleQrLookup(selectedCustomer.loyalty.publicQrToken);
      fetchRecentActivity();
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.error === "DUPLICATE_TRANSACTION") {
        setOverrideAction({ type: "purchase" });
        setOverrideMessage("Duplicate transaction detected. Enter Manager/Admin PIN to log another purchase today.");
        setShowOverrideModal(true);
      } else {
        setErrorState(e.response?.data?.error || "Failed to log purchase.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Action: Redeem Unlocked Reward
  const handleRedeemReward = async (reward: any, bypassPin?: string) => {
    if (!selectedCustomer) return;
    setErrorState(null);
    setSuccessState(null);
    setActionLoading(true);

    try {
      const res = await apiClient.post("/api/tablet/redeem-reward", {
        customerId: selectedCustomer.customer.id,
        rewardId: reward.id,
        pinOverride: bypassPin
      });

      setSuccessState(res.data.message);
      canvasConfetti({ particleCount: 80, spread: 50 });
      
      await handleQrLookup(selectedCustomer.loyalty.publicQrToken);
      fetchRecentActivity();
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.error === "APPROVAL_REQUIRED") {
        setOverrideAction({ type: "redeem", data: reward });
        setOverrideMessage(`${reward.name} is high-value. Enter Manager/Admin PIN to finalize redemption.`);
        setShowOverrideModal(true);
      } else {
        setErrorState(e.response?.data?.error || "Failed to redeem reward.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Modal PIN Bypass Handler
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (!overridePin) {
      setOverrideError("Please enter a PIN.");
      return;
    }

    try {
      // Validate PIN credentials
      const valRes = await apiClient.post("/api/tablet/request-manager-approval", { pin: overridePin });
      
      if (valRes.data.success) {
        // Execute original action with manager bypass!
        setShowOverrideModal(false);
        const pin = overridePin;
        setOverridePin("");
        
        if (overrideAction.type === "visit") {
          await handleAddVisit(pin);
        } else if (overrideAction.type === "redeem") {
          await handleRedeemReward(overrideAction.data, pin);
        } else if (overrideAction.type === "purchase") {
          await handleAddPurchase(undefined, pin);
        }
      }
    } catch (e: any) {
      setOverrideError(e.response?.data?.error || "Invalid PIN or insufficient roles.");
    }
  };

  const handleLogout = async () => {
    await logoutStaff();
    navigate("/staff/login");
  };

  if (!staffUser) return null;

  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col font-sans">
      
      {/* Tablet Navigation Header */}
      <header className="bg-black/20 border-b border-white/5 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-brand-red fill-brand-red animate-pulse" />
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase">Boudin Boss Counter Mode</h1>
            <p className="text-[10px] text-gray-400 font-bold">Accessory Tablet Portal • Logged in: {staffUser.name} ({staffUser.role})</p>
          </div>
        </div>

        <div className="flex gap-3">
          {(staffUser.role === "Administrator" || staffUser.role === "Manager") && (
            <button 
              onClick={() => navigate("/admin")}
              className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Admin Dashboard
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="bg-brand-red hover:bg-brand-red/95 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Clock Out</span>
          </button>
        </div>
      </header>

      {/* Main Tablet Layout Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Navigation Quick Tabs */}
        <aside className="w-48 bg-black/10 border-r border-white/5 flex flex-col p-4 gap-2 shrink-0">
          <button 
            onClick={() => { setActiveTab("scan"); setErrorState(null); }}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 transition-all ${
              activeTab === "scan" ? "bg-brand-red text-white shadow-lg" : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            <Scan className="w-6 h-6" />
            <span>Scan Customer</span>
          </button>

          <button 
            onClick={() => { setActiveTab("search"); setErrorState(null); }}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 transition-all ${
              activeTab === "search" ? "bg-brand-red text-white shadow-lg" : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            <Search className="w-6 h-6" />
            <span>Search Customer</span>
          </button>

          {selectedCustomer && (
            <button 
              onClick={() => setActiveTab("customer")}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 transition-all border ${
                activeTab === "customer" 
                  ? "bg-brand-gold text-brand-charcoal border-brand-gold shadow-lg" 
                  : "bg-white/5 hover:bg-white/10 text-brand-gold border-brand-gold/20"
              }`}
            >
              <Award className="w-6 h-6" />
              <span>Current Profile</span>
            </button>
          )}

          <button 
            onClick={() => { setActiveTab("activity"); fetchRecentActivity(); }}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 transition-all mt-auto ${
              activeTab === "activity" ? "bg-white/10 text-white shadow" : "bg-white/5 hover:bg-white/10 text-gray-400"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </button>
        </aside>

        {/* Right Side: View Contents */}
        <main className="flex-1 p-6 overflow-y-auto bg-brand-charcoal/40">
          
          {errorState && (
            <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-bold rounded-2xl p-4 text-xs mb-6 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>⚠️ Error: {errorState}</span>
            </div>
          )}

          {successState && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl p-4 text-xs mb-6 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>🎉 {successState}</span>
            </div>
          )}

          {/* TAB 1: SCAN CUSTOMER */}
          {activeTab === "scan" && (
            <div className="max-w-md mx-auto text-center space-y-6 py-10">
              <div className="space-y-2">
                <Scan className="w-14 h-14 mx-auto text-brand-red" />
                <h3 className="text-xl font-black tracking-tight">Scan Customer QR Code</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
                  Use the iPad/tablet camera or type a demo check-in token to pull up the customer's rewards profile immediately.
                </p>
              </div>

              {!showScanner ? (
                <button 
                  onClick={() => setShowScanner(true)}
                  className="gradient-red hover:opacity-95 text-white font-extrabold py-4 px-8 rounded-2xl shadow-lg shadow-brand-red/20 btn-animate text-xs uppercase tracking-wider"
                >
                  Turn On Tablet Camera
                </button>
              ) : (
                <div className="bg-white text-black p-4 rounded-3xl max-w-xs mx-auto shadow-2xl relative">
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-black p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div id="qr-reader-container" className="w-full rounded-2xl overflow-hidden border"></div>
                  <span className="text-[10px] font-bold text-gray-500 block mt-2">Hold customer phone QR up to the lens</span>
                </div>
              )}

              {/* Sandbox Mock Tester inputs */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left max-w-xs mx-auto space-y-3">
                <p className="text-[10px] font-black text-brand-red uppercase tracking-wider">Demo / Sandbox Token Tester:</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="token_remy_boss_55"
                    className="flex-1 bg-brand-charcoal border border-white/10 rounded-xl py-1.5 px-3 text-xs font-mono focus:outline-none focus:border-brand-red"
                  />
                  <button
                    onClick={() => handleQrLookup(tokenInput || "token_remy_boss_55")}
                    className="bg-brand-red hover:bg-brand-red/95 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
                  >
                    Fetch
                  </button>
                </div>
                <div className="text-[8px] text-gray-400 space-y-1">
                  <p>Common demo tokens to try:</p>
                  <p>• <code className="text-white">token_remy_boss_55</code> (Remy Lebeau - Boss Tier)</p>
                  <p>• <code className="text-white">token_clotile_bayou_88</code> (Clotile Hebert)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH CUSTOMER */}
          {activeTab === "search" && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-black tracking-tight">Manual Customer Search</h3>
                <p className="text-xs text-gray-400 mt-1">Lookup account by Name, Phone, Email, or Rewards Account Number.</p>
              </div>

              <form onSubmit={handleTextSearch} className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Remy or 832-555-0505..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-brand-red"
                />
                <button 
                  type="submit"
                  className="bg-brand-red hover:bg-brand-red/95 font-extrabold px-6 rounded-2xl text-xs uppercase tracking-wider"
                >
                  Search
                </button>
              </form>

              {/* Search Results Grid */}
              <div className="space-y-2">
                {searchResults.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => handleSelectCustomerFromSearch(c)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-gray-400">{c.email || "No Email"} • {c.phone || "No Phone"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/25 block mb-1">
                        {c.tierName}
                      </span>
                      <span className="text-xs font-bold text-brand-red">{c.pointsBalance} PTS</span>
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && searchQuery && !actionLoading && (
                  <p className="text-xs text-gray-500 text-center py-6">No matching loyalty accounts found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SELECTED CUSTOMER DETAILS & ACTIONS */}
          {activeTab === "customer" && selectedCustomer && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Profile Card Summary */}
              <div className="space-y-6">
                <div className="bg-white text-brand-charcoal rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-charcoal text-white text-3xl flex items-center justify-center font-black">
                      🤠
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full border border-brand-red/25 uppercase tracking-wide">
                        {selectedCustomer.loyalty.currentTierName}
                      </span>
                      <h3 className="text-lg font-black tracking-tight mt-1 leading-snug">
                        {selectedCustomer.customer.firstName} {selectedCustomer.customer.lastName}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Card: {selectedCustomer.loyalty.rewardsNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-brand-light rounded-xl p-2 border border-gray-100">
                      <p className="text-[8px] font-extrabold text-gray-400 uppercase">Points</p>
                      <p className="text-lg font-black text-brand-red flex items-center justify-center gap-0.5">
                        <Zap className="w-3.5 h-3.5 fill-brand-red text-brand-red" />
                        {selectedCustomer.loyalty.pointsBalance}
                      </p>
                    </div>

                    <div className="bg-brand-light rounded-xl p-2 border border-gray-100">
                      <p className="text-[8px] font-extrabold text-gray-400 uppercase">Visits</p>
                      <p className="text-lg font-black text-brand-gold flex items-center justify-center gap-0.5">
                        <Award className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                        {selectedCustomer.loyalty.totalVisits}
                      </p>
                    </div>

                    <div className="bg-brand-light rounded-xl p-2 border border-gray-100">
                      <p className="text-[8px] font-extrabold text-gray-400 uppercase">Total Spend</p>
                      <p className="text-sm font-black pt-0.5 text-brand-charcoal">
                        ${parseFloat(selectedCustomer.loyalty.lifetimeSpend).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="text-[9px] text-gray-400 font-medium space-y-0.5 pt-2 border-t">
                    <p>• Email: <code className="text-brand-charcoal font-bold">{selectedCustomer.customer.email || "N/A"}</code></p>
                    <p>• Phone: <code className="text-brand-charcoal font-bold">{selectedCustomer.customer.phone || "N/A"}</code></p>
                    <p>• Favorite: <code className="text-brand-charcoal font-bold">{selectedCustomer.customer.favoriteCategory || "N/A"}</code></p>
                  </div>
                </div>

                {/* Quick Add Actions */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4">
                  <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Quick Action Panel</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleAddVisit()}
                      className="bg-brand-red hover:bg-brand-red/95 py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-1.5 btn-animate shadow-md"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Log Visit check-in</span>
                    </button>

                    <span className="text-[9px] text-gray-400 leading-snug flex items-center pl-2">
                      Adds 1 visit and defaults 10 points to customer card automatically. Enforces daily check-in limits.
                    </span>
                  </div>

                  <form onSubmit={handleAddPurchase} className="border-t border-white/5 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Add Purchase Amount</p>
                    
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        placeholder="Enter dollars spent (e.g. 45.50)..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red text-white"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold/95 font-extrabold px-4 rounded-xl text-xs uppercase"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Rewards Claim list */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4">
                <h4 className="font-extrabold text-xs text-brand-gold uppercase tracking-wider">Eligible Loyalty Rewards</h4>
                
                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                  {selectedCustomer.loyalty.pointsBalance >= 50 ? (
                    // Load and show active reward cards (simulating backend check)
                    // Let's draw three seeded rewards
                    [
                      { id: 1, name: "Free Drink Upgrade", cost: 50, type: "Drink", desc: "Large sweet tea or soda" },
                      { id: 2, name: "Free Small Side", cost: 100, type: "Side", desc: "Okra, fries, or dirty rice" },
                      { id: 3, name: "Free Boudin Ball", cost: 150, type: "Snack", desc: "Hot crispy traditional boudin ball" },
                      { id: 5, name: "Boudin Boss Reward", cost: 400, type: "Meal", desc: "Free links basket (High-Value)", override: true }
                    ].map(item => {
                      const balance = selectedCustomer.loyalty.pointsBalance;
                      const hasPoints = balance >= item.cost;

                      return (
                        <div 
                          key={item.id} 
                          className={`border rounded-2xl p-4 flex justify-between items-center transition-all ${
                            hasPoints 
                              ? "bg-white/5 border-emerald-500/20 hover:bg-white/10" 
                              : "bg-black/20 border-white/5 opacity-50"
                          }`}
                        >
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs">{item.name}</h5>
                            <p className="text-[9px] text-gray-400">{item.desc}</p>
                          </div>
                          
                          <button
                            disabled={!hasPoints || actionLoading}
                            onClick={() => handleRedeemReward({ id: item.id, name: item.name, highValue: item.override })}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                              hasPoints 
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95" 
                                : "bg-white/5 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Redeem ({item.cost} PTS)
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 bg-black/10 rounded-2xl border border-dashed border-white/5">
                      <span className="text-lg">🍢</span>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">Customer has less than 50 points. No rewards unlocked.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: RECENT ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="max-w-xl mx-auto space-y-4">
              <h3 className="text-lg font-black tracking-tight">Recent Table Activity Feed</h3>
              
              <div className="bg-white/5 border border-white/5 rounded-3xl divide-y divide-white/5">
                {recentTabletLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs">{log.customerName}</p>
                      <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{log.reason}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                      log.pointsChange > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-brand-red/10 text-brand-red"
                    }`}>
                      {log.pointsChange > 0 ? `+${log.pointsChange}` : log.pointsChange} PTS
                    </span>
                  </div>
                ))}

                {recentTabletLogs.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-6">No recent actions logged on this tablet today.</p>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* OVERRIDE PIN SECURITY MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-extrabold tracking-tight">Manager PIN Required</h4>
              <p className="text-xs text-gray-400 leading-relaxed px-4">
                {overrideMessage}
              </p>
            </div>

            {overrideError && (
              <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-[10px] font-bold rounded-xl p-2.5 text-center">
                ⚠️ {overrideError}
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input 
                type="password"
                maxLength={4}
                value={overridePin}
                onChange={(e) => setOverridePin(e.target.value.replace(/\D/g, ""))} // Numbers only
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 text-center text-2xl font-mono tracking-[1.5em] focus:outline-none focus:border-brand-red text-white"
                required
              />

              {/* Numerical Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (overridePin.length < 4) {
                        setOverridePin(overridePin + num);
                      }
                    }}
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-black flex items-center justify-center transition-all border border-white/5 hover:border-brand-red/35"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOverridePin("")}
                  className="w-14 h-14 rounded-full bg-brand-red/10 hover:bg-brand-red/20 active:scale-95 text-[10px] font-extrabold text-brand-red flex items-center justify-center transition-all border border-brand-red/20"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (overridePin.length < 4) {
                      setOverridePin(overridePin + "0");
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-black flex items-center justify-center transition-all border border-white/5 hover:border-brand-red/35"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setOverridePin(overridePin.slice(0, -1))}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-black flex items-center justify-center transition-all border border-white/5 hover:border-brand-red/35 font-mono"
                >
                  ⌫
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverridePin("");
                    setOverrideError(null);
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-3 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-brand-red hover:bg-brand-red/95 rounded-2xl py-3 text-xs font-bold transition-all text-white flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Authorize PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
