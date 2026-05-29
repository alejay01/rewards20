import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart3, Users, Award, Flame, RefreshCw, FileText, 
  Settings, LogOut, Search, Plus, UserPlus, Zap, Trash, 
  Check, X, ShieldAlert, Key, HelpCircle 
} from "lucide-react";
import axios from "axios";

export const AdminPage: React.FC = () => {
  const { staffUser, logoutStaff, apiClient } = useAuth();
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!staffUser) {
      navigate("/staff/login");
    } else if (staffUser.role !== "Administrator" && staffUser.role !== "Manager") {
      navigate("/tablet"); // Enforce role redirect
    }
  }, [staffUser, navigate]);

  // States
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "customers" | "rewards" | "promotions" | "claims" | "loyverse" | "audits">("overview");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Lists
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [promosList, setPromosList] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [loyverseStatus, setLoyverseStatus] = useState<any>(null);

  // Search & Detail Overlays
  const [custSearch, setCustSearch] = useState("");
  const [selectedCust, setSelectedCust] = useState<any | null>(null);

  // Manual Adjustments Form
  const [manualPoints, setManualPoints] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualActionType, setManualActionType] = useState<"add" | "subtract">("add");
  const [manualError, setManualError] = useState<string | null>(null);

  // Form Modals states
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  
  // Loyverse action loaders
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (staffUser) {
      loadOverviewMetrics();
    }
  }, [staffUser, activeSubTab]);

  const loadOverviewMetrics = async () => {
    setLoading(true);
    try {
      if (activeSubTab === "overview") {
        const res = await apiClient.get("/api/admin/overview");
        setMetrics(res.data);
      } else if (activeSubTab === "customers") {
        const res = await apiClient.get(`/api/admin/customers?search=${custSearch}`);
        setCustomerList(res.data);
      } else if (activeSubTab === "rewards") {
        const res = await apiClient.get("/api/admin/rewards");
        setRewardsList(res.data);
      } else if (activeSubTab === "promotions") {
        const res = await apiClient.get("/api/admin/promotions");
        setPromosList(res.data);
      } else if (activeSubTab === "claims") {
        const res = await apiClient.get("/api/admin/receipt-claims");
        setClaimsList(res.data);
      } else if (activeSubTab === "loyverse") {
        const res = await apiClient.get("/api/admin/integrations/loyverse/status");
        setLoyverseStatus(res.data);
      } else if (activeSubTab === "audits") {
        const res = await apiClient.get("/api/admin/audit-logs");
        setAuditLogsList(res.data);
      }
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = async (id: number) => {
    try {
      const res = await apiClient.get(`/api/admin/customers/${id}`);
      setSelectedCust(res.data);
    } catch (e) {
      console.error("Failed to load customer details:", e);
    }
  };

  const handleManualPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!selectedCust || !manualPoints || !manualReason) return;

    try {
      const endpoint = manualActionType === "add" ? "add-points" : "subtract-points";
      await apiClient.post(`/api/admin/customers/${selectedCust.customer.id}/${endpoint}`, {
        points: parseInt(manualPoints),
        reason: manualReason
      });

      // Reload
      setManualPoints("");
      setManualReason("");
      await handleCustomerClick(selectedCust.customer.id);
      loadOverviewMetrics();
    } catch (e: any) {
      setManualError(e.response?.data?.message || e.response?.data?.error || "Adjustment rejected.");
    }
  };

  // Receipt approvals
  const handleApproveClaim = async (id: number) => {
    try {
      await apiClient.post(`/api/admin/receipt-claims/${id}/approve`);
      loadOverviewMetrics();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to approve claim.");
    }
  };

  const handleRejectClaim = async (id: number) => {
    const reason = prompt("Enter a rejection reason:");
    if (reason === null) return;
    try {
      await apiClient.post(`/api/admin/receipt-claims/${id}/reject`, { reason });
      loadOverviewMetrics();
    } catch (e) {
      console.error(e);
    }
  };

  // Loyverse Actions
  const handleLoyverseTest = async () => {
    setSyncMessage("Testing connection...");
    try {
      const res = await apiClient.post("/api/admin/integrations/loyverse/test");
      setSyncMessage(res.data.message);
    } catch (e: any) {
      setSyncMessage(`Test failed: ${e.response?.data?.error}`);
    }
  };

  const handleLoyverseSync = async (type: "customers" | "receipts") => {
    setSyncLoading(true);
    setSyncMessage(`Syncing Loyverse ${type}...`);
    try {
      const res = await apiClient.post(`/api/admin/integrations/loyverse/sync-${type}`);
      setSyncMessage(res.data.message);
      // Reload stats
      const statusRes = await apiClient.get("/api/admin/integrations/loyverse/status");
      setLoyverseStatus(statusRes.data);
    } catch (e: any) {
      setSyncMessage(`Sync failed: ${e.response?.data?.error}`);
    } finally {
      setSyncLoading(false);
    }
  };

  if (!staffUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-brand-charcoal">
      
      {/* Admin Navbar */}
      <header className="bg-brand-charcoal text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-brand-red fill-brand-red animate-pulse" />
          <div>
            <h1 className="text-md font-black tracking-wider uppercase">Boudin Boss Admin Portal</h1>
            <p className="text-[10px] text-gray-400 font-bold">Store Dashboard • {staffUser.name} ({staffUser.role})</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => navigate("/tablet")}
            className="bg-brand-red text-white hover:bg-brand-red/95 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow shadow-brand-red/10"
          >
            Tablet Cashier Mode
          </button>
          
          <button 
            onClick={async () => { await logoutStaff(); navigate("/staff/login"); }}
            className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 text-white"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Sidebar Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col gap-1.5 shrink-0 shadow-sm">
          {[
            { id: "overview", label: "Overview Metrics", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "customers", label: "Customer List", icon: <Users className="w-4 h-4" /> },
            { id: "rewards", label: "Loyalty Rewards", icon: <Award className="w-4 h-4" /> },
            { id: "promotions", label: "Specials/Promos", icon: <Flame className="w-4 h-4" /> },
            { id: "claims", label: "Receipt Claims", icon: <FileText className="w-4 h-4" /> },
            { id: "loyverse", label: "Loyverse Sync", icon: <Settings className="w-4 h-4" /> },
            { id: "audits", label: "System Audits", icon: <ShieldAlert className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); setSelectedCust(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 ${
                activeSubTab === tab.id 
                  ? "bg-brand-charcoal text-white shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-brand-charcoal"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content body */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW METRICS */}
          {activeSubTab === "overview" && metrics && (
            <div className="space-y-8">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Members", val: metrics.metrics.totalMembers, color: "border-l-brand-charcoal" },
                  { label: "New Members Today", val: metrics.metrics.newMembersToday, color: "border-l-brand-red" },
                  { label: "Total Shop Visits", val: metrics.metrics.totalVisits, color: "border-l-brand-gold" },
                  { label: "Pending Claims", val: metrics.metrics.pendingClaims, color: "border-l-orange-500" }
                ].map((card, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${card.color} flex justify-between items-center`}>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">{card.label}</p>
                      <p className="text-2xl font-black text-brand-charcoal mt-1">{card.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts & Top Customers Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Members */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 text-brand-charcoal">
                    <Users className="w-4 h-4 text-brand-red" />
                    <span>Top Customer Accounts (Point Balances)</span>
                  </h4>
                  
                  <div className="divide-y divide-gray-50">
                    {metrics.topCustomers.map((c: any) => (
                      <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.email || "No Email"}</p>
                        </div>
                        <span className="font-black text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-lg">
                          {c.pointsBalance} PTS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Rewards */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 text-brand-charcoal">
                    <Award className="w-4 h-4 text-brand-gold" />
                    <span>Most Claimed Rewards</span>
                  </h4>

                  <div className="divide-y divide-gray-50">
                    {metrics.popularRewards.map((r: any, i: number) => (
                      <div key={i} className="py-3 flex justify-between items-center text-xs">
                        <span className="font-bold">{r.rewardName}</span>
                        <span className="font-extrabold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded-md">
                          {r.count} Redemptions
                        </span>
                      </div>
                    ))}

                    {metrics.popularRewards.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">No redemptions logged yet.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CUSTOMERS MANAGEMENT */}
          {activeSubTab === "customers" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input 
                    type="text" 
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    placeholder="Search by Name, Email, Phone, Card Number..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red shadow-sm"
                  />
                  <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-gray-400" />
                </div>
                <button 
                  onClick={loadOverviewMetrics}
                  className="bg-brand-charcoal text-white hover:bg-brand-charcoal/95 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Filter Search</span>
                </button>
              </div>

              {/* Split Content: List or Detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* List Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm md:col-span-2 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Tier Status</th>
                        <th className="py-3 px-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {customerList.map(c => (
                        <tr 
                          key={c.id} 
                          onClick={() => handleCustomerClick(c.id)}
                          className="hover:bg-gray-50/50 cursor-pointer transition-all"
                        >
                          <td className="py-3.5 px-4 font-bold">{c.firstName} {c.lastName}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-mono text-[10px]">
                            {c.email || c.phone || "No Contact info"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-[9px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/20">
                              {c.tierName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-brand-red">{c.pointsBalance} PTS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detail Summary panel */}
                {selectedCust ? (
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-md space-y-6 sticky top-8">
                    
                    <div className="space-y-1 text-center">
                      <h4 className="font-extrabold text-sm text-brand-charcoal leading-snug">
                        {selectedCust.customer.firstName} {selectedCust.customer.lastName}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {selectedCust.loyalty.rewardsNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-gray-50 border rounded-xl p-2">
                        <p className="text-[8px] font-extrabold text-gray-400 uppercase">Available Points</p>
                        <p className="text-lg font-black text-brand-red">{selectedCust.loyalty.pointsBalance}</p>
                      </div>
                      <div className="bg-gray-50 border rounded-xl p-2">
                        <p className="text-[8px] font-extrabold text-gray-400 uppercase">Visits</p>
                        <p className="text-lg font-black text-brand-gold">{selectedCust.loyalty.totalVisits}</p>
                      </div>
                    </div>

                    {/* Manual points adjustment Form */}
                    <form onSubmit={handleManualPointsSubmit} className="border-t pt-4 space-y-3">
                      <p className="text-[10px] font-extrabold text-brand-charcoal uppercase tracking-wider">Manual Points Adjustment</p>
                      
                      {manualError && (
                        <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-[8px] font-bold p-2 rounded-lg">
                          {manualError}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setManualActionType("add")}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                            manualActionType === "add" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "border-gray-250 text-gray-400"
                          }`}
                        >
                          Credit Points
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualActionType("subtract")}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                            manualActionType === "subtract" ? "bg-brand-red text-white border-brand-red shadow-sm" : "border-gray-250 text-gray-400"
                          }`}
                        >
                          Deduct Points
                        </button>
                      </div>

                      <input 
                        type="number"
                        placeholder="Points amount (e.g. 50)..."
                        value={manualPoints}
                        onChange={(e) => setManualPoints(e.target.value)}
                        className="w-full bg-gray-50 border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-red"
                        required
                      />

                      <textarea 
                        placeholder="Detailed business adjustment reason..."
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-red"
                        required
                      />

                      <button 
                        type="submit"
                        className="w-full gradient-bg text-white font-bold py-2 rounded-xl text-xs hover:opacity-95"
                      >
                        Execute Adjustment
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center py-10">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold">Select a loyalty customer from the list to manage points and view ledgers.</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: LOYALTY REWARDS CRUD */}
          {activeSubTab === "rewards" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Active Loyalty Rewards</h3>
                  <p className="text-xs text-gray-400 mt-1">Configure visits, spend, or points-based loyalty redemptions.</p>
                </div>
                <button 
                  onClick={() => setShowAddRewardModal(true)}
                  className="bg-brand-red text-white hover:bg-brand-red/95 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Reward</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Reward Name</th>
                      <th className="py-3 px-4">Requirement</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Approval Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {rewardsList.map(r => (
                      <tr key={r.id}>
                        <td className="py-3.5 px-4">
                          <p className="font-bold">{r.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{r.description}</p>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold uppercase">
                          {r.rewardType === "points" && `${r.pointsRequired} Pts`}
                          {r.rewardType === "visit" && `${r.visitsRequired} Visits`}
                          {r.rewardType === "spend" && `$${parseFloat(r.spendRequired).toFixed(0)} Spend`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            r.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-400"
                          }`}>
                            {r.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                            r.managerApprovalRequired ? "bg-red-50 text-brand-red border border-red-150" : "bg-gray-50 text-gray-400"
                          }`}>
                            {r.managerApprovalRequired ? "PIN Required" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: SPECIALS / PROMOTIONS CRUD */}
          {activeSubTab === "promotions" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Cajun Specials & Promotions</h3>
                  <p className="text-xs text-gray-400 mt-1">Simmer active campaigns, double points events, or specials.</p>
                </div>
                <button 
                  onClick={() => setShowAddPromoModal(true)}
                  className="bg-brand-red text-white hover:bg-brand-red/95 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simmer Promo</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Promotion Campaign</th>
                      <th className="py-3 px-4">Multiplier</th>
                      <th className="py-3 px-4">Audience</th>
                      <th className="py-3 px-4 text-right">Active Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {promosList.map(p => (
                      <tr key={p.id}>
                        <td className="py-3.5 px-4">
                          <p className="font-bold">{p.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            p.doublePoints ? "bg-brand-red text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                            {p.doublePoints ? "2X MULTIPLIER" : "1X Standard"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold capitalize">{p.audienceType}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            p.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-400"
                          }`}>
                            {p.active ? "LIVE" : "INACTIVE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: RECEIPT CLAIMS REVIEW */}
          {activeSubTab === "claims" && (
            <div className="space-y-6">
              
              <div>
                <h3 className="text-lg font-black tracking-tight">Pending Receipt Claims</h3>
                <p className="text-xs text-gray-400 mt-1">Review missed purchase points claims submitted by rewards members.</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Receipt Info</th>
                      <th className="py-3 px-4">Claimant details</th>
                      <th className="py-3 px-4">Claim Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {claimsList.map(c => (
                      <tr key={c.id} className={c.status === "FLAGGED" ? "bg-amber-50/20" : ""}>
                        <td className="py-3.5 px-4">
                          <p className="font-bold">Receipt #{c.receiptNumber}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Purchased: {c.purchaseDate.split("T")[0]}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold">{c.claimantName}</p>
                          <p className="text-[10px] text-gray-400">{c.claimantEmail || c.claimantPhone}</p>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-brand-charcoal">${parseFloat(c.purchaseTotal).toFixed(2)}</td>
                        <td className="py-3.5 px-4 font-extrabold">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            c.status === "PENDING" && "bg-blue-50 text-blue-500"
                          } ${
                            c.status === "APPROVED" && "bg-emerald-50 text-emerald-600"
                          } ${
                            c.status === "REJECTED" && "bg-gray-100 text-gray-400"
                          } ${
                            c.status === "FLAGGED" && "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {(c.status === "PENDING" || c.status === "FLAGGED") ? (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleApproveClaim(c.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded-lg shadow-sm"
                                title="Approve & Award Points"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRejectClaim(c.id)}
                                className="bg-brand-red hover:bg-brand-red/95 text-white p-1 rounded-lg shadow-sm"
                                title="Reject Claim"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {claimsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-gray-400 font-bold">No receipt claims submitted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 6: LOYVERSE SETTINGS & SYNC */}
          {activeSubTab === "loyverse" && loyverseStatus && (
            <div className="max-w-xl mx-auto space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-brand-red" />
                      <span>Loyverse Sync Settings</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Configure automated point mapping and sync intervals.</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase py-1 px-3 rounded-full ${
                    loyverseStatus.status === "connected" ? "bg-emerald-500 text-white animate-pulse" : "bg-brand-red text-white"
                  }`}>
                    {loyverseStatus.status === "connected" ? "Connected" : "Not Linked"}
                  </span>
                </div>

                {syncMessage && (
                  <div className="bg-brand-light p-3 rounded-2xl border text-xs font-bold text-brand-red">
                    ℹ️ Status Alert: {syncMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center text-xs pt-2">
                  <div className="bg-gray-50 rounded-xl p-3 border">
                    <p className="text-[8px] font-extrabold text-gray-400 uppercase">Mapped Accounts</p>
                    <p className="text-lg font-black mt-1 text-brand-charcoal">{loyverseStatus.mappingsCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border">
                    <p className="text-[8px] font-extrabold text-gray-400 uppercase">Unmatched Receipts Queue</p>
                    <p className="text-lg font-black mt-1 text-brand-red">{loyverseStatus.unmatchedReceiptsCount}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button 
                    disabled={syncLoading}
                    onClick={async () => {
                      try {
                        const res = await apiClient.get("/api/admin/integrations/loyverse/oauth-url");
                        if (res.data.oauthUrl) {
                          window.location.href = res.data.oauthUrl;
                        }
                      } catch (err: any) {
                        alert("Failed to fetch authorization URL: " + (err.response?.data?.error || err.message));
                      }
                    }}
                    className="w-full gradient-red hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-xs btn-animate flex items-center justify-center gap-1.5 shadow-md shadow-brand-red/10"
                  >
                    <Flame className="w-4 h-4 fill-white/10 text-white" />
                    <span>Link Loyverse Account via OAuth</span>
                  </button>

                  <button 
                    disabled={syncLoading}
                    onClick={handleLoyverseTest}
                    className="w-full bg-brand-charcoal hover:bg-brand-charcoal/95 text-white font-extrabold py-3 rounded-xl text-xs btn-animate"
                  >
                    Test Connection (Status check)
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      disabled={syncLoading}
                      onClick={() => handleLoyverseSync("customers")}
                      className="bg-brand-red hover:bg-brand-red/95 text-white font-extrabold py-3 rounded-xl text-xs btn-animate"
                    >
                      Sync Loyverse Customers
                    </button>
                    <button 
                      disabled={syncLoading}
                      onClick={() => handleLoyverseSync("receipts")}
                      className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold/95 font-extrabold py-3 rounded-xl text-xs btn-animate"
                    >
                      Sync Loyverse Receipts
                    </button>
                  </div>
                </div>
              </div>

              {/* Integration Logs Feed */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Sync Transaction Logs Feed</h4>
                
                <div className="divide-y divide-gray-50 text-[10px] space-y-2 font-mono">
                  {loyverseStatus.logs.map((log: any) => (
                    <div key={log.id} className="py-2.5 flex justify-between items-start">
                      <div>
                        <p className="font-black text-brand-charcoal">{log.action.toUpperCase()}</p>
                        <p className="text-gray-400 mt-0.5">{log.message}</p>
                      </div>
                      <span className={`font-black ${
                        log.status === "success" ? "text-emerald-500" : "text-brand-red"
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  ))}

                  {loyverseStatus.logs.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No sync tasks executed today.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: SYSTEM AUDIT LOGS */}
          {activeSubTab === "audits" && (
            <div className="space-y-6">
              
              <div>
                <h3 className="text-lg font-black tracking-tight">System Security Audits</h3>
                <p className="text-xs text-gray-400 mt-1">Review the most recent sensitive adjustments, overrides, and role actions.</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Security Reason / Note</th>
                      <th className="py-3 px-4">Impact</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {auditLogsList.map(log => (
                      <tr key={log.id}>
                        <td className="py-3.5 px-4 font-bold text-brand-charcoal">
                          <p>{log.action}</p>
                          <p className="text-[9px] font-bold text-gray-400 tracking-wide uppercase mt-0.5">Role: {log.actorRole || "System"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">{log.reason}</td>
                        <td className="py-3.5 px-4 font-extrabold">
                          {log.pointsChange !== null ? (
                            <span className={log.pointsChange > 0 ? "text-emerald-500" : "text-brand-red"}>
                              {log.pointsChange > 0 ? `+${log.pointsChange}` : log.pointsChange} PTS
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-400 text-[10px] font-mono">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
};
