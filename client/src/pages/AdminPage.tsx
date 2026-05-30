import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart3, Users, Award, Flame, RefreshCw, FileText, 
  Settings, LogOut, Search, Plus, UserPlus, Zap, Trash, 
  Check, X, ShieldAlert, Key, HelpCircle, PlusCircle
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
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "customers" | "rewards" | "promotions" | "claims" | "loyverse" | "audits" | "staff">("overview");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Lists
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [promosList, setPromosList] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [loyverseStatus, setLoyverseStatus] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);

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
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

  // Edit Customer Form State
  const [editCustFirstName, setEditCustFirstName] = useState("");
  const [editCustLastName, setEditCustLastName] = useState("");
  const [editCustEmail, setEditCustEmail] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [editCustBirthday, setEditCustBirthday] = useState("");
  const [editCustFavoriteCategory, setEditCustFavoriteCategory] = useState("");
  const [editCustConsentPromotions, setEditCustConsentPromotions] = useState(false);
  const [editCustStatus, setEditCustStatus] = useState("active");
  const [editCustFormError, setEditCustFormError] = useState<string | null>(null);
  const [editCustFormLoading, setEditCustFormLoading] = useState(false);

  // Create/Edit Staff Form State
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [staffRoleId, setStaffRoleId] = useState<number | "">("");
  const [staffActive, setStaffActive] = useState(true);
  const [staffFormError, setStaffFormError] = useState<string | null>(null);
  const [staffFormLoading, setStaffFormLoading] = useState(false);

  // Create Customer Form State
  const [custFirstName, setCustFirstName] = useState("");
  const [custLastName, setCustLastName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custBirthday, setCustBirthday] = useState("");
  const [custFavoriteCategory, setCustFavoriteCategory] = useState("");
  const [custConsentPromotions, setCustConsentPromotions] = useState(false);
  const [custStartingPoints, setCustStartingPoints] = useState("0");
  const [custFormError, setCustFormError] = useState<string | null>(null);
  const [custFormLoading, setCustFormLoading] = useState(false);

  // Create Reward Form State
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardType, setRewardType] = useState("visit"); // "visit" | "spend" | "points"
  const [rewardPointsRequired, setRewardPointsRequired] = useState("0");
  const [rewardVisitsRequired, setRewardVisitsRequired] = useState("0");
  const [rewardSpendRequired, setRewardSpendRequired] = useState("0.00");
  const [rewardHighValue, setRewardHighValue] = useState(false);
  const [rewardManagerApproval, setRewardManagerApproval] = useState(false);
  const [rewardFormError, setRewardFormError] = useState<string | null>(null);
  const [rewardFormLoading, setRewardFormLoading] = useState(false);

  // Create Promotion Form State
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoAudienceType, setPromoAudienceType] = useState("all");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoFeatured, setPromoFeatured] = useState(false);
  const [promoDoublePoints, setPromoDoublePoints] = useState(false);
  const [promoImageUrl, setPromoImageUrl] = useState("");
  const [promoFormError, setPromoFormError] = useState<string | null>(null);
  const [promoFormLoading, setPromoFormLoading] = useState(false);
  
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
      } else if (activeSubTab === "staff") {
        const res = await apiClient.get("/api/admin/staff");
        setStaffList(res.data);
        const rRes = await apiClient.get("/api/admin/roles");
        setRolesList(rRes.data);
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustFormError(null);
    setCustFormLoading(true);
    try {
      await apiClient.post("/api/admin/customers", {
        firstName: custFirstName,
        lastName: custLastName,
        email: custEmail || undefined,
        phone: custPhone || undefined,
        birthday: custBirthday || undefined,
        favoriteCategory: custFavoriteCategory || undefined,
        consentPromotions: custConsentPromotions,
        startingPoints: parseInt(custStartingPoints || "0")
      });
      setCustFirstName("");
      setCustLastName("");
      setCustEmail("");
      setCustPhone("");
      setCustBirthday("");
      setCustFavoriteCategory("");
      setCustConsentPromotions(false);
      setCustStartingPoints("0");
      setShowAddCustomerModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setCustFormError(err.response?.data?.error || "Failed to create customer.");
    } finally {
      setCustFormLoading(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    setEditCustFormError(null);
    setEditCustFormLoading(true);
    try {
      await apiClient.patch(`/api/admin/customers/${selectedCust.customer.id}`, {
        firstName: editCustFirstName,
        lastName: editCustLastName,
        email: editCustEmail || undefined,
        phone: editCustPhone || undefined,
        birthday: editCustBirthday || undefined,
        favoriteCategory: editCustFavoriteCategory || undefined,
        consentPromotions: editCustConsentPromotions,
        status: editCustStatus
      });
      setShowEditCustomerModal(false);
      await handleCustomerClick(selectedCust.customer.id);
      loadOverviewMetrics();
    } catch (err: any) {
      setEditCustFormError(err.response?.data?.error || "Failed to update customer.");
    } finally {
      setEditCustFormLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError(null);
    setStaffFormLoading(true);
    try {
      await apiClient.post("/api/admin/staff", {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        pin: staffPin || undefined,
        roleId: parseInt(staffRoleId.toString()),
        active: staffActive
      });
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffPin("");
      setStaffRoleId("");
      setStaffActive(true);
      setShowAddStaffModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setStaffFormError(err.response?.data?.error || "Failed to create staff member.");
    } finally {
      setStaffFormLoading(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setStaffFormError(null);
    setStaffFormLoading(true);
    try {
      await apiClient.patch(`/api/admin/staff/${selectedStaff.id}`, {
        name: staffName,
        email: staffEmail,
        password: staffPassword || undefined,
        pin: staffPin || undefined,
        roleId: parseInt(staffRoleId.toString()),
        active: staffActive
      });
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffPin("");
      setStaffRoleId("");
      setStaffActive(true);
      setSelectedStaff(null);
      setShowEditStaffModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setStaffFormError(err.response?.data?.error || "Failed to update staff member.");
    } finally {
      setStaffFormLoading(false);
    }
  };

  const toggleStaffActiveStatus = async (staff: any) => {
    try {
      await apiClient.patch(`/api/admin/staff/${staff.id}`, {
        active: !staff.active
      });
      loadOverviewMetrics();
    } catch (err: any) {
      alert("Failed to toggle staff active status: " + (err.response?.data?.error || err.message));
    }
  };

  const openEditCustomerModal = (cust: any) => {
    setEditCustFirstName(cust.customer.firstName);
    setEditCustLastName(cust.customer.lastName);
    setEditCustEmail(cust.customer.email || "");
    setEditCustPhone(cust.customer.phone || "");
    setEditCustBirthday(cust.customer.birthday ? cust.customer.birthday.substring(0, 10) : "");
    setEditCustFavoriteCategory(cust.customer.favoriteCategory || "");
    setEditCustConsentPromotions(cust.customer.consentPromotions || false);
    setEditCustStatus(cust.customer.status || "active");
    setEditCustFormError(null);
    setShowEditCustomerModal(true);
  };

  const openEditStaffModal = (staff: any) => {
    setSelectedStaff(staff);
    setStaffName(staff.name);
    setStaffEmail(staff.email);
    setStaffPassword("");
    setStaffPin("");
    setStaffRoleId(staff.roleId);
    setStaffActive(staff.active);
    setStaffFormError(null);
    setShowEditStaffModal(true);
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setRewardFormError(null);
    setRewardFormLoading(true);
    try {
      await apiClient.post("/api/admin/rewards", {
        name: rewardName,
        description: rewardDescription || undefined,
        rewardType,
        pointsRequired: parseInt(rewardPointsRequired || "0"),
        visitsRequired: parseInt(rewardVisitsRequired || "0"),
        spendRequired: rewardSpendRequired || "0.00",
        highValue: rewardHighValue,
        managerApprovalRequired: rewardManagerApproval
      });
      setRewardName("");
      setRewardDescription("");
      setRewardType("visit");
      setRewardPointsRequired("0");
      setRewardVisitsRequired("0");
      setRewardSpendRequired("0.00");
      setRewardHighValue(false);
      setRewardManagerApproval(false);
      setShowAddRewardModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setRewardFormError(err.response?.data?.error || "Failed to create reward.");
    } finally {
      setRewardFormLoading(false);
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFormError(null);
    setPromoFormLoading(true);
    try {
      await apiClient.post("/api/admin/promotions", {
        title: promoTitle,
        description: promoDescription,
        audienceType: promoAudienceType,
        startDate: promoStartDate,
        endDate: promoEndDate,
        featured: promoFeatured,
        doublePoints: promoDoublePoints,
        imageUrl: promoImageUrl || undefined
      });
      setPromoTitle("");
      setPromoDescription("");
      setPromoAudienceType("all");
      setPromoStartDate("");
      setPromoEndDate("");
      setPromoFeatured(false);
      setPromoDoublePoints(false);
      setPromoImageUrl("");
      setShowAddPromoModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setPromoFormError(err.response?.data?.error || "Failed to create promotion.");
    } finally {
      setPromoFormLoading(false);
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
            { id: "audits", label: "System Audits", icon: <ShieldAlert className="w-4 h-4" /> },
            { id: "staff", label: "Staff Access", icon: <Key className="w-4 h-4" /> }
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
              
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[280px] max-w-md">
                  <input 
                    type="text" 
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    placeholder="Search by Name, Email, Phone, Card Number..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-2 px-3 pl-8 text-xs font-medium focus:outline-none focus:border-brand-red shadow-sm"
                  />
                  <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddCustomerModal(true)}
                    className="bg-brand-red text-white hover:bg-brand-red/95 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Customer</span>
                  </button>
                  <button 
                    onClick={loadOverviewMetrics}
                    className="bg-brand-charcoal text-white hover:bg-brand-charcoal/95 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
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

                    {/* Complete Customer Profile Details */}
                    <div className="space-y-3 border-t pt-4 text-xs">
                      <div className="flex justify-between items-center pb-1">
                        <p className="text-[10px] font-extrabold text-brand-charcoal uppercase tracking-wider">Contact & Profile Info</p>
                        <button
                          type="button"
                          onClick={() => openEditCustomerModal(selectedCust)}
                          className="text-[10px] text-brand-red hover:underline font-bold"
                        >
                          Edit Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] leading-tight">
                        <div className="overflow-hidden">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Email Address</p>
                          <p className="font-semibold text-brand-charcoal truncate" title={selectedCust.customer.email || "No Email Provided"}>
                            {selectedCust.customer.email || "No Email"}
                          </p>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Phone Number</p>
                          <p className="font-semibold text-brand-charcoal truncate" title={selectedCust.customer.phone || "No Phone Provided"}>
                            {selectedCust.customer.phone || "No Phone"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Birthday</p>
                          <p className="font-semibold text-brand-charcoal">
                            {selectedCust.customer.birthday ? new Date(selectedCust.customer.birthday).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Not Set"}
                          </p>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Favorite Item</p>
                          <p className="font-semibold text-brand-charcoal truncate">{selectedCust.customer.favoriteCategory || "Not Specified"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Loyalty Tier</p>
                          <p className="font-bold text-brand-gold">{selectedCust.loyalty.tierName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Status</p>
                          <p className={`font-bold capitalize ${selectedCust.customer.status === "active" ? "text-emerald-600" : "text-brand-red"}`}>
                            {selectedCust.customer.status}
                          </p>
                        </div>
                        <div className="col-span-2 overflow-hidden">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Barcode Card / QR Token</p>
                          <p className="font-mono text-gray-500 truncate" title={selectedCust.loyalty.barcodeValue || selectedCust.loyalty.publicQrToken}>
                            {selectedCust.loyalty.barcodeValue || selectedCust.loyalty.rewardsNumber}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase">Member Since</p>
                          <p className="font-semibold text-gray-500">
                            {new Date(selectedCust.customer.createdAt).toLocaleDateString()} at {new Date(selectedCust.customer.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCust.customer.consentPromotions ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">
                          {selectedCust.customer.consentPromotions ? "Consented to Promotions" : "No Promo Consent"}
                        </p>
                      </div>
                    </div>

                    {/* Points history / Ledger logs */}
                    {selectedCust.ledger && selectedCust.ledger.length > 0 && (
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-[10px] font-extrabold text-brand-charcoal uppercase tracking-wider">Points Ledger History</p>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-sans">
                          {selectedCust.ledger.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-center text-[10px] bg-gray-50 border border-gray-100 rounded-lg p-1.5">
                              <div className="space-y-0.5 max-w-[70%]">
                                <p className="font-bold text-brand-charcoal truncate" title={log.reason || "Points adjustment"}>
                                  {log.reason || "Points adjustment"}
                                </p>
                                <p className="text-[8px] text-gray-400 font-mono">{new Date(log.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span className={`font-mono font-black shrink-0 ${log.pointsChange > 0 ? "text-emerald-600" : "text-brand-red"}`}>
                                {log.pointsChange > 0 ? `+${log.pointsChange}` : log.pointsChange} PTS
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

          {/* TAB 8: STAFF ACCESS MANAGEMENT */}
          {activeSubTab === "staff" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Staff Access Control</h3>
                  <p className="text-xs text-gray-400 mt-1">Manage employee login credentials, system roles, tablet PIN codes, and active statuses.</p>
                </div>
                <button
                  onClick={() => {
                    setStaffName("");
                    setStaffEmail("");
                    setStaffPassword("");
                    setStaffPin("");
                    setStaffRoleId("");
                    setStaffActive(true);
                    setStaffFormError(null);
                    setShowAddStaffModal(true);
                  }}
                  className="gradient-bg text-white hover:opacity-95 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Staff Member</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Active Status</th>
                      <th className="py-3 px-4 text-nowrap">Date Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {staffList.map(staff => (
                      <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-brand-charcoal">
                          {staff.name} {staff.id === staffUser?.id && <span className="text-[8px] bg-brand-charcoal text-white rounded-full px-1.5 py-0.5 ml-1 font-normal uppercase">You</span>}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-medium">{staff.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            staff.roleName === "Administrator" ? "bg-red-50 text-brand-red border border-brand-red/20" :
                            staff.roleName === "Manager" ? "bg-amber-50 text-brand-gold border border-brand-gold/20" :
                            "bg-slate-50 text-slate-500 border border-slate-200"
                          }`}>
                            {staff.roleName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                            staff.active 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                              : "bg-gray-50 text-gray-400 border border-gray-200"
                          }`}>
                            {staff.active ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-[9px] text-nowrap">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-3 text-nowrap">
                          <button
                            onClick={() => openEditStaffModal(staff)}
                            className="text-[10px] font-bold text-brand-charcoal hover:text-brand-red"
                          >
                            Edit
                          </button>
                          {staff.id !== staffUser?.id && (
                            <button
                              onClick={() => toggleStaffActiveStatus(staff)}
                              className={`text-[10px] font-bold ${
                                staff.active ? "text-brand-red hover:opacity-80" : "text-emerald-600 hover:opacity-80"
                              }`}
                            >
                              {staff.active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-gray-400 font-bold">
                          No staff users found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

         </main>
      </div>

      {/* MODAL 1: ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Create Loyalty Customer</span>
              </h4>
              <button 
                onClick={() => { setShowAddCustomerModal(false); setCustFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {custFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {custFormError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">First Name *</label>
                  <input 
                    type="text" 
                    value={custFirstName}
                    onChange={(e) => setCustFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name *</label>
                  <input 
                    type="text" 
                    value={custLastName}
                    onChange={(e) => setCustLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address (Optional)</label>
                <input 
                  type="email" 
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. customer@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. 713-555-0101"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Birthday (Optional)</label>
                  <input 
                    type="date" 
                    value={custBirthday}
                    onChange={(e) => setCustBirthday(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Favorite Item</label>
                  <select 
                    value={custFavoriteCategory}
                    onChange={(e) => setCustFavoriteCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  >
                    <option value="">Select Item...</option>
                    <option value="Boudin Links">Boudin Links</option>
                    <option value="Boudin Balls">Boudin Balls</option>
                    <option value="Gumbo">Gumbo</option>
                    <option value="Crawfish Pie">Crawfish Pie</option>
                    <option value="Daiquiri">Daiquiri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Starting Points Balance</label>
                  <input 
                    type="number" 
                    value={custStartingPoints}
                    onChange={(e) => setCustStartingPoints(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="consentCheck"
                    checked={custConsentPromotions}
                    onChange={(e) => setCustConsentPromotions(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="consentCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Consent to Promotions
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowAddCustomerModal(false); setCustFormError(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={custFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {custFormLoading ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD REWARD MODAL */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Create Loyalty Reward</span>
              </h4>
              <button 
                onClick={() => { setShowAddRewardModal(false); setRewardFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rewardFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {rewardFormError}
              </div>
            )}

            <form onSubmit={handleCreateReward} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Reward Name *</label>
                <input 
                  type="text" 
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. Free Small Fries"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description (Optional)</label>
                <textarea 
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="Details of the reward..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Threshold Type *</label>
                  <select 
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  >
                    <option value="visit">Visit Check-In Count</option>
                    <option value="spend">Spend (USD) Amount</option>
                    <option value="points">Points Cost Balance</option>
                  </select>
                </div>

                {rewardType === "visit" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Visits Required</label>
                    <input 
                      type="number" 
                      value={rewardVisitsRequired}
                      onChange={(e) => setRewardVisitsRequired(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-brand-charcoal"
                      min="0"
                    />
                  </div>
                )}

                {rewardType === "spend" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Spend Required ($)</label>
                    <input 
                      type="text" 
                      value={rewardSpendRequired}
                      onChange={(e) => setRewardSpendRequired(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-brand-charcoal"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {rewardType === "points" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Points Cost</label>
                    <input 
                      type="number" 
                      value={rewardPointsRequired}
                      onChange={(e) => setRewardPointsRequired(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-brand-charcoal"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="highValueCheck"
                    checked={rewardHighValue}
                    onChange={(e) => setRewardHighValue(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="highValueCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    High Value Flag
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="approvalCheck"
                    checked={rewardManagerApproval}
                    onChange={(e) => setRewardManagerApproval(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="approvalCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Requires Manager PIN
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowAddRewardModal(false); setRewardFormError(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={rewardFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {rewardFormLoading ? "Saving..." : "Save Reward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD PROMOTION MODAL */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Create Shop Promotion</span>
              </h4>
              <button 
                onClick={() => { setShowAddPromoModal(false); setPromoFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {promoFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {promoFormError}
              </div>
            )}

            <form onSubmit={handleCreatePromotion} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Promotion Title *</label>
                <input 
                  type="text" 
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. Double Points Friday"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description *</label>
                <textarea 
                  value={promoDescription}
                  onChange={(e) => setPromoDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="Special details and rules..."
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Start Date *</label>
                  <input 
                    type="date" 
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">End Date *</label>
                  <input 
                    type="date" 
                    value={promoEndDate}
                    onChange={(e) => setPromoEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Audience Scope</label>
                  <select 
                    value={promoAudienceType}
                    onChange={(e) => setPromoAudienceType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  >
                    <option value="all">All Members</option>
                    <option value="rookie">Rookies Only</option>
                    <option value="boss">PIT Bosses Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Image Banner URL (Optional)</label>
                  <input 
                    type="text" 
                    value={promoImageUrl}
                    onChange={(e) => setPromoImageUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="featuredPromo"
                    checked={promoFeatured}
                    onChange={(e) => setPromoFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="featuredPromo" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Featured Banner
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="doublePointsPromo"
                    checked={promoDoublePoints}
                    onChange={(e) => setPromoDoublePoints(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="doublePointsPromo" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Trigger Double Points (2x)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowAddPromoModal(false); setPromoFormError(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={promoFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {promoFormLoading ? "Saving..." : "Save Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CUSTOMER PROFILE MODAL */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Edit Customer Profile</span>
              </h4>
              <button 
                onClick={() => { setShowEditCustomerModal(false); setEditCustFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editCustFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {editCustFormError}
              </div>
            )}

            <form onSubmit={handleEditCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">First Name *</label>
                  <input 
                    type="text" 
                    value={editCustFirstName}
                    onChange={(e) => setEditCustFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name *</label>
                  <input 
                    type="text" 
                    value={editCustLastName}
                    onChange={(e) => setEditCustLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address (Optional)</label>
                <input 
                  type="email" 
                  value={editCustEmail}
                  onChange={(e) => setEditCustEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. customer@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. 713-555-0101"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Birthday (Optional)</label>
                  <input 
                    type="date" 
                    value={editCustBirthday}
                    onChange={(e) => setEditCustBirthday(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Favorite Item</label>
                  <select 
                    value={editCustFavoriteCategory}
                    onChange={(e) => setEditCustFavoriteCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  >
                    <option value="">Select Item...</option>
                    <option value="Boudin Links">Boudin Links</option>
                    <option value="Boudin Balls">Boudin Balls</option>
                    <option value="Gumbo">Gumbo</option>
                    <option value="Crawfish Pie">Crawfish Pie</option>
                    <option value="Daiquiri">Daiquiri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Account Status</label>
                  <select 
                    value={editCustStatus}
                    onChange={(e) => setEditCustStatus(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="editConsentCheck"
                    checked={editCustConsentPromotions}
                    onChange={(e) => setEditCustConsentPromotions(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editConsentCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Consent to Promotions
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowEditCustomerModal(false); setEditCustFormError(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={editCustFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {editCustFormLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD STAFF MEMBER MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <Key className="w-5 h-5 text-brand-red" />
                <span>Create Staff Member</span>
              </h4>
              <button 
                onClick={() => { setShowAddStaffModal(false); setStaffFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {staffFormError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Employee Name *</label>
                <input 
                  type="text" 
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. Jean Thibodeaux"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Login Email Address *</label>
                <input 
                  type="email" 
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. jean@theboudincompany.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Password *</label>
                  <input 
                    type="password" 
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    placeholder="Min 6 chars"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tablet PIN Code (4 Digits)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal text-center tracking-widest font-mono"
                    placeholder="e.g. 1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Assigned Security Role *</label>
                  <select 
                    value={staffRoleId}
                    onChange={(e) => setStaffRoleId(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  >
                    <option value="">Select Role...</option>
                    {rolesList.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="staffActiveCheck"
                    checked={staffActive}
                    onChange={(e) => setStaffActive(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="staffActiveCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Enable Active Login
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowAddStaffModal(false); setStaffFormError(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={staffFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {staffFormLoading ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT STAFF MEMBER MODAL */}
      {showEditStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <Key className="w-5 h-5 text-brand-red" />
                <span>Edit Staff Member</span>
              </h4>
              <button 
                onClick={() => { setShowEditStaffModal(false); setStaffFormError(null); setSelectedStaff(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3">
                ⚠️ {staffFormError}
              </div>
            )}

            <form onSubmit={handleEditStaff} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Employee Name *</label>
                <input 
                  type="text" 
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. Jean Thibodeaux"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Login Email Address *</label>
                <input 
                  type="email" 
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                  placeholder="e.g. jean@theboudincompany.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">New Password (Optional)</label>
                  <input 
                    type="password" 
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                    placeholder="Leave blank to keep"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tablet PIN Code (Optional)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal text-center tracking-widest font-mono"
                    placeholder="Leave blank to keep"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Assigned Security Role *</label>
                  <select 
                    value={staffRoleId}
                    onChange={(e) => setStaffRoleId(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal"
                    required
                  >
                    <option value="">Select Role...</option>
                    {rolesList.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="editStaffActiveCheck"
                    checked={staffActive}
                    onChange={(e) => setStaffActive(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editStaffActiveCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Enable Active Login
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowEditStaffModal(false); setStaffFormError(null); setSelectedStaff(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={staffFormLoading}
                  className="flex-1 bg-brand-red hover:bg-brand-red/95 py-3 rounded-xl text-xs font-black uppercase text-white transition-all shadow"
                >
                  {staffFormLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
