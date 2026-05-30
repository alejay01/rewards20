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
  const { staffUser, logoutStaff, apiClient, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (authLoading) return;

    if (!staffUser) {
      navigate("/staff/login");
    } else if (staffUser.role !== "Administrator" && staffUser.role !== "Manager") {
      navigate("/tablet"); // Enforce role redirect
    } else if (staffUser.authMethod === "pin") {
      navigate("/tablet"); // Enforce password-only auth for sensitive admin dashboard
    }
  }, [staffUser, authLoading, navigate]);

  // States
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "customers" | "rewards" | "promotions" | "claims" | "loyverse" | "security" | "pwa" | "audits" | "staff">("overview");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  
  // New whitelisting and settings states
  const [pendingDevicesCount, setPendingDevicesCount] = useState(0);
  const [pendingDevicesList, setPendingDevicesList] = useState<any[]>([]);
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState<any[]>([]);
  const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
  const [saveSettingsMessage, setSaveSettingsMessage] = useState<string | null>(null);

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
  const [showEditRewardModal, setShowEditRewardModal] = useState(false);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [showEditPromoModal, setShowEditPromoModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);

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

  // Create/Edit Reward Form State
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardType, setRewardType] = useState("visit"); // "visit" | "spend" | "points"
  const [rewardPointsRequired, setRewardPointsRequired] = useState("0");
  const [rewardVisitsRequired, setRewardVisitsRequired] = useState("0");
  const [rewardSpendRequired, setRewardSpendRequired] = useState("0.00");
  const [rewardHighValue, setRewardHighValue] = useState(false);
  const [rewardManagerApproval, setRewardManagerApproval] = useState(false);
  const [rewardActive, setRewardActive] = useState(true);
  const [rewardFormError, setRewardFormError] = useState<string | null>(null);
  const [rewardFormLoading, setRewardFormLoading] = useState(false);

  // Create/Edit Promotion Form State
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoAudienceType, setPromoAudienceType] = useState("all");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoFeatured, setPromoFeatured] = useState(false);
  const [promoDoublePoints, setPromoDoublePoints] = useState(false);
  const [promoImageUrl, setPromoImageUrl] = useState("");
  const [promoLinkedRewardId, setPromoLinkedRewardId] = useState<number | "">("");
  const [editPromoLinkedRewardId, setEditPromoLinkedRewardId] = useState<number | "">("");
  const [promoActive, setPromoActive] = useState(true);
  const [promoFormError, setPromoFormError] = useState<string | null>(null);
  const [promoFormLoading, setPromoFormLoading] = useState(false);
  
  // Audit filter states
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [selectedAuditEmail, setSelectedAuditEmail] = useState("");
  const [selectedAuditAction, setSelectedAuditAction] = useState("");
  
  // Loyverse action loaders
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const checkPendingDevices = async () => {
    try {
      const res = await apiClient.get("/api/admin/devices");
      const pending = res.data.filter((d: any) => d.status === "pending");
      setPendingDevicesCount(pending.length);
      setPendingDevicesList(pending);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (staffUser) {
      loadOverviewMetrics();
      checkPendingDevices();
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
      } else if (activeSubTab === "security") {
        const dRes = await apiClient.get("/api/admin/devices");
        setDevicesList(dRes.data);
        const sRes = await apiClient.get("/api/admin/security-settings");
        setSecuritySettings(sRes.data);
      } else if (activeSubTab === "pwa") {
        const sRes = await apiClient.get("/api/admin/security-settings");
        setSecuritySettings(sRes.data);
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
        imageUrl: promoImageUrl || undefined,
        linkedRewardId: parseInt(promoLinkedRewardId.toString()) || null
      });
      setPromoTitle("");
      setPromoDescription("");
      setPromoAudienceType("all");
      setPromoStartDate("");
      setPromoEndDate("");
      setPromoFeatured(false);
      setPromoDoublePoints(false);
      setPromoImageUrl("");
      setPromoLinkedRewardId("");
      setShowAddPromoModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setPromoFormError(err.response?.data?.error || "Failed to create promotion.");
    } finally {
      setPromoFormLoading(false);
    }
  };

  const openEditRewardModal = (reward: any) => {
    setSelectedReward(reward);
    setRewardName(reward.name);
    setRewardDescription(reward.description || "");
    setRewardType(reward.rewardType);
    setRewardPointsRequired(reward.pointsRequired.toString());
    setRewardVisitsRequired(reward.visitsRequired.toString());
    setRewardSpendRequired(parseFloat(reward.spendRequired).toFixed(2));
    setRewardHighValue(reward.highValue);
    setRewardManagerApproval(reward.managerApprovalRequired);
    setRewardActive(reward.active);
    setRewardFormError(null);
    setShowEditRewardModal(true);
  };

  const handleEditReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;
    setRewardFormError(null);
    setRewardFormLoading(true);
    try {
      await apiClient.patch(`/api/admin/rewards/${selectedReward.id}`, {
        name: rewardName,
        description: rewardDescription || undefined,
        rewardType,
        pointsRequired: parseInt(rewardPointsRequired || "0"),
        visitsRequired: parseInt(rewardVisitsRequired || "0"),
        spendRequired: rewardSpendRequired || "0.00",
        highValue: rewardHighValue,
        managerApprovalRequired: rewardManagerApproval,
        active: rewardActive
      });
      setRewardName("");
      setRewardDescription("");
      setRewardType("visit");
      setRewardPointsRequired("0");
      setRewardVisitsRequired("0");
      setRewardSpendRequired("0.00");
      setRewardHighValue(false);
      setRewardManagerApproval(false);
      setSelectedReward(null);
      setShowEditRewardModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setRewardFormError(err.response?.data?.error || "Failed to update reward.");
    } finally {
      setRewardFormLoading(false);
    }
  };

  const handleDeleteReward = async (id: number) => {
    if (!confirm("Are you sure you want to delete this loyalty reward?")) return;
    try {
      await apiClient.delete(`/api/admin/rewards/${id}`);
      loadOverviewMetrics();
    } catch (err: any) {
      alert("Failed to delete reward: " + (err.response?.data?.error || err.message));
    }
  };

  const openEditPromoModal = (promo: any) => {
    setSelectedPromo(promo);
    setPromoTitle(promo.title);
    setPromoDescription(promo.description);
    setPromoAudienceType(promo.audienceType || "all");
    setPromoStartDate(promo.startDate ? promo.startDate.substring(0, 10) : "");
    setPromoEndDate(promo.endDate ? promo.endDate.substring(0, 10) : "");
    setPromoFeatured(promo.featured);
    setPromoDoublePoints(promo.doublePoints);
    setPromoImageUrl(promo.imageUrl || "");
    setEditPromoLinkedRewardId(promo.linkedRewardId || "");
    setPromoActive(promo.active);
    setPromoFormError(null);
    setShowEditPromoModal(true);
  };

  const handleEditPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromo) return;
    setPromoFormError(null);
    setPromoFormLoading(true);
    try {
      await apiClient.patch(`/api/admin/promotions/${selectedPromo.id}`, {
        title: promoTitle,
        description: promoDescription,
        audienceType: promoAudienceType,
        startDate: promoStartDate,
        endDate: promoEndDate,
        featured: promoFeatured,
        doublePoints: promoDoublePoints,
        imageUrl: promoImageUrl || undefined,
        linkedRewardId: parseInt(editPromoLinkedRewardId.toString()) || null,
        active: promoActive
      });
      setPromoTitle("");
      setPromoDescription("");
      setPromoAudienceType("all");
      setPromoStartDate("");
      setPromoEndDate("");
      setPromoFeatured(false);
      setPromoDoublePoints(false);
      setPromoImageUrl("");
      setEditPromoLinkedRewardId("");
      setSelectedPromo(null);
      setShowEditPromoModal(false);
      loadOverviewMetrics();
    } catch (err: any) {
      setPromoFormError(err.response?.data?.error || "Failed to update promotion.");
    } finally {
      setPromoFormLoading(false);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promotion campaign?")) return;
    try {
      await apiClient.delete(`/api/admin/promotions/${id}`);
      loadOverviewMetrics();
    } catch (err: any) {
      alert("Failed to delete promotion: " + (err.response?.data?.error || err.message));
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

  // Device whitelisting and settings handlers
  const handleApproveDevice = async (deviceId: number) => {
    try {
      const res = await apiClient.post("/api/admin/devices/approve", { deviceId });
      alert(res.data.message || "Device approved!");
      loadOverviewMetrics();
      checkPendingDevices();
    } catch (err: any) {
      alert("Error approving device: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRejectDevice = async (deviceId: number) => {
    if (!confirm("Are you sure you want to block/reject this device?")) return;
    try {
      const res = await apiClient.post("/api/admin/devices/reject", { deviceId });
      alert(res.data.message || "Device rejected!");
      loadOverviewMetrics();
      checkPendingDevices();
    } catch (err: any) {
      alert("Error rejecting device: " + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleRemote = async (deviceId: number) => {
    try {
      const res = await apiClient.post("/api/admin/devices/toggle-remote", { deviceId });
      loadOverviewMetrics();
    } catch (err: any) {
      alert("Error toggling remote access: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSettingsLoading(true);
    setSaveSettingsMessage(null);
    try {
      const payload = securitySettings.map(s => ({ key: s.key, value: s.value }));
      const res = await apiClient.post("/api/admin/security-settings", payload);
      setSaveSettingsMessage(res.data.message || "Settings saved!");
      const updated = await apiClient.get("/api/admin/security-settings");
      setSecuritySettings(updated.data);
      setTimeout(() => setSaveSettingsMessage(null), 3000);
    } catch (err: any) {
      setSaveSettingsMessage("Error saving settings: " + (err.response?.data?.error || err.message));
    } finally {
      setSaveSettingsLoading(false);
    }
  };

  const updateSettingStateValue = (key: string, value: string) => {
    setSecuritySettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const safeGetSetting = (key: string) => {
    if (!Array.isArray(securitySettings)) return undefined;
    return securitySettings.find(s => s.key === key);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-white flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-10 h-10 text-brand-red animate-spin" />
        <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Securing Cajun Portals...</p>
      </div>
    );
  }

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
            // Security tab temporarily hidden as requested
            // { id: "security", label: "Security Access", icon: <ShieldAlert className="w-4 h-4" /> },
            { id: "pwa", label: "PWA Settings", icon: <Settings className="w-4 h-4" /> },
            { id: "audits", label: "System Audits", icon: <FileText className="w-4 h-4" /> },
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
          
          {/* Security Alert Banner (Temporarily disabled as requested) */}
          {false && pendingDevicesCount > 0 && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-4 mb-6 shadow-md border-b-2 border-red-800 flex justify-between items-center relative overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 relative z-10">
                <ShieldAlert className="w-6 h-6 text-white animate-bounce shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">⚠️ Security Alert! Unrecognized Devices Detected</h4>
                  <p className="text-[10px] text-red-100 font-bold mt-0.5 leading-snug">
                    {pendingDevicesCount} Non-Boudin Company devices have attempted to access the cashier portals. Please audit and approve them immediately.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveSubTab("security"); }}
                className="bg-white text-red-600 font-black text-[10px] uppercase px-4 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow relative z-10"
              >
                Authorize Devices
              </button>
            </div>
          )}
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
                            <div key={log.id} className="flex justify-between items-center text-[10px] bg-gray-50 border border-gray-100 rounded-lg p-1.5 hover:bg-gray-100/50 transition-colors">
                              <div className="space-y-0.5 max-w-[70%]">
                                <p className="font-bold text-brand-charcoal truncate" title={log.reason || "Points adjustment"}>
                                  {log.reason || "Points adjustment"}
                                </p>
                                {log.receiptNumber && (
                                  <p className="text-[8px] text-brand-red font-extrabold uppercase">
                                    Receipt: {log.receiptNumber} {log.amount && `| $${parseFloat(log.amount).toFixed(2)}`}
                                  </p>
                                )}
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

                    {/* Cajun Purchasing Trends */}
                    {selectedCust.trends && selectedCust.trends.length > 0 && (
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-extrabold text-brand-charcoal uppercase tracking-wider">Purchasing Trends</p>
                          <span className="text-[8px] font-black uppercase text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/25">
                            Favorite: {selectedCust.trends[0]?.itemName || "N/A"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedCust.trends.slice(0, 3).map((item: any, idx: number) => {
                            const colors = ["bg-brand-red", "bg-brand-gold", "bg-brand-charcoal"];
                            const barColor = colors[idx % colors.length];
                            const maxCount = selectedCust.trends[0]?.count || 1;
                            const percent = Math.round((item.count / maxCount) * 100);

                            return (
                              <div key={item.itemName} className="space-y-1 text-[10px]">
                                <div className="flex justify-between font-bold text-gray-600">
                                  <span>{item.itemName}</span>
                                  <span className="font-mono text-brand-charcoal">{item.count} orders</span>
                                </div>
                                <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${barColor} rounded-full transition-all`} 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
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
                      <th className="py-3 px-4 text-center">Approval Required</th>
                      <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                            r.managerApprovalRequired ? "bg-red-50 text-brand-red border border-red-150" : "bg-gray-50 text-gray-400"
                          }`}>
                            {r.managerApprovalRequired ? "PIN Required" : "No"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-3 text-nowrap">
                          <button
                            onClick={() => openEditRewardModal(r)}
                            className="text-[10px] font-bold text-brand-charcoal hover:text-brand-red"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReward(r.id)}
                            className="text-[10px] font-bold text-brand-red hover:opacity-85"
                          >
                            Delete
                          </button>
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
                      <th className="py-3 px-4 text-nowrap">Campaign Duration</th>
                      <th className="py-3 px-4">Type / Multiplier</th>
                      <th className="py-3 px-4">Audience</th>
                      <th className="py-3 px-4">Active Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {promosList.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="font-bold text-brand-charcoal truncate" title={p.title}>{p.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={p.description}>{p.description}</p>
                          {p.linkedRewardId && (
                            <p className="text-[8px] text-brand-gold font-extrabold uppercase mt-1">
                              🎁 Linked Reward ID: {p.linkedRewardId}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-medium text-[10px] text-nowrap">
                          <div>Starts: {new Date(p.startDate).toLocaleDateString()}</div>
                          <div>Ends: {new Date(p.endDate).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            p.doublePoints ? "bg-brand-red text-white" : "bg-gray-100 text-gray-450"
                          }`}>
                            {p.doublePoints ? "2X MULTIPLIER" : "1X Standard"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold capitalize text-gray-500">{p.audienceType}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            p.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-50 text-gray-400 border border-gray-250"
                          }`}>
                            {p.active ? "LIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-3 text-nowrap">
                          <button
                            onClick={() => openEditPromoModal(p)}
                            className="text-[10px] font-bold text-brand-charcoal hover:text-brand-red"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(p.id)}
                            className="text-[10px] font-bold text-brand-red hover:opacity-85"
                          >
                            Delete
                          </button>
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
          {activeSubTab === "audits" && (() => {
            const uniqueEmails = Array.from(new Set(auditLogsList.map(log => log.actorEmail).filter(Boolean))) as string[];
            const uniqueActions = Array.from(new Set(auditLogsList.map(log => log.action).filter(Boolean))) as string[];

            const filteredAudits = auditLogsList.filter(log => {
              const matchesSearch = !auditSearchQuery ? true : (
                (log.action?.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                (log.reason?.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                (log.actorEmail?.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                (log.actorName?.toLowerCase().includes(auditSearchQuery.toLowerCase()))
              );
              
              const matchesEmail = !selectedAuditEmail ? true : log.actorEmail === selectedAuditEmail;
              const matchesAction = !selectedAuditAction ? true : log.action === selectedAuditAction;
              
              return matchesSearch && matchesEmail && matchesAction;
            });

            return (
              <div className="space-y-6">
                
                <div>
                  <h3 className="text-lg font-black tracking-tight">System Security Audits</h3>
                  <p className="text-xs text-gray-400 mt-1">Review the most recent sensitive adjustments, overrides, and role actions.</p>
                </div>

                {/* Filter Controls */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
                  
                  {/* Search query input */}
                  <div className="relative w-full md:w-1/3">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search logs (email, description, action)..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-3 focus:outline-none focus:border-brand-red text-brand-charcoal text-xs font-medium"
                    />
                  </div>

                  {/* Dropdown Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-2/3 md:justify-end">
                    <div className="w-full sm:w-48 space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Filter by Staff Email</label>
                      <select
                        value={selectedAuditEmail}
                        onChange={(e) => setSelectedAuditEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-brand-red text-brand-charcoal"
                      >
                        <option value="">-- All Emails --</option>
                        {uniqueEmails.map(email => (
                          <option key={email} value={email}>{email}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-48 space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Filter by Action Type</label>
                      <select
                        value={selectedAuditAction}
                        onChange={(e) => setSelectedAuditAction(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-brand-red text-brand-charcoal"
                      >
                        <option value="">-- All Actions --</option>
                        {uniqueActions.map(act => (
                          <option key={act} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(auditSearchQuery || selectedAuditEmail || selectedAuditAction) && (
                      <button
                        onClick={() => {
                          setAuditSearchQuery("");
                          setSelectedAuditEmail("");
                          setSelectedAuditAction("");
                        }}
                        className="text-brand-red hover:underline text-xs font-bold self-end py-2 px-1 text-nowrap"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                        <th className="py-3 px-4">Action Type</th>
                        <th className="py-3 px-4">Changed By</th>
                        <th className="py-3 px-4">Security Reason / Note</th>
                        <th className="py-3 px-4">Impact</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {filteredAudits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 font-bold">
                            ⚠️ No audit logs match your search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAudits.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-brand-charcoal">
                              <p>{log.action}</p>
                              <p className="text-[9px] font-bold text-gray-400 tracking-wide uppercase mt-0.5">Role: {log.actorRole || "System"}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              {log.actorEmail ? (
                                <div>
                                  <p className="font-bold text-brand-charcoal">{log.actorName || "Staff Member"}</p>
                                  <p className="text-[10px] text-gray-400 lowercase">{log.actorEmail}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400 font-mono text-[10px] uppercase">SYSTEM / SELF</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 max-w-[300px] truncate" title={log.reason}>{log.reason}</td>
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
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })()}

          {/* TAB 6.5: SECURITY ACCESS MANAGEMENT */}
          {activeSubTab === "security" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-black tracking-tight">Security Access Control</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Enforce hardware device MAC/fingerprint whitelisting, configure remote bypass permissions, and manage geofencing coordinates.
                </p>
              </div>

              {saveSettingsMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold text-center border ${
                  saveSettingsMessage.includes("Error") 
                    ? "bg-red-50 border-red-200 text-brand-red" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-600 animate-bounce"
                }`}>
                  {saveSettingsMessage}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Geofence & Whitelisting Settings Form */}
                <form onSubmit={handleSaveSecuritySettings} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 lg:col-span-1">
                  <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b pb-2">IP & Geofencing Parameters</h4>
                  
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Store IP Whitelist</label>
                    <textarea
                      rows={2}
                      value={securitySettings.find(s => s.key === "security_ip_whitelist")?.value || ""}
                      onChange={(e) => updateSettingStateValue("security_ip_whitelist", e.target.value)}
                      placeholder="e.g. 127.0.0.1, 8.8.8.8"
                      className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold font-mono focus:outline-none focus:border-brand-red"
                    />
                    <p className="text-[8px] text-gray-400 mt-1">Comma-separated external router IP addresses allowed to bypass geofences.</p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 text-xs text-brand-charcoal font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={securitySettings.find(s => s.key === "security_geofence_enabled")?.value === "true"}
                        onChange={(e) => updateSettingStateValue("security_geofence_enabled", e.target.checked ? "true" : "false")}
                        className="mt-0.5 rounded border-gray-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                      />
                      <span>Enable Cashier Geofencing</span>
                    </label>
                    <p className="text-[8px] text-gray-400 pl-5.5 mt-0.5">Strictly checks cashier GPS clock-in coordinates against the store location.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Store Latitude</label>
                      <input 
                        type="number"
                        step="0.0001"
                        value={securitySettings.find(s => s.key === "security_geofence_lat")?.value || ""}
                        onChange={(e) => updateSettingStateValue("security_geofence_lat", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Store Longitude</label>
                      <input 
                        type="number"
                        step="0.0001"
                        value={securitySettings.find(s => s.key === "security_geofence_lng")?.value || ""}
                        onChange={(e) => updateSettingStateValue("security_geofence_lng", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Allowed Radius (Feet)</label>
                    <input 
                      type="number"
                      value={securitySettings.find(s => s.key === "security_geofence_radius")?.value || ""}
                      onChange={(e) => updateSettingStateValue("security_geofence_radius", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-brand-red"
                    />
                    <p className="text-[8px] text-gray-400 mt-1">Cashier device must be within this radius to access Counter mode.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={saveSettingsLoading}
                    className="w-full bg-brand-charcoal hover:bg-brand-charcoal/95 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                  >
                    {saveSettingsLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{saveSettingsLoading ? "Saving Settings..." : "Save Parameters"}</span>
                  </button>
                </form>

                {/* Device Whitelisting Inventory */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden space-y-4">
                  <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Audited Counter Devices</h4>
                    <span className="text-[9px] font-black bg-brand-red/10 text-brand-red border border-brand-red/20 px-2 py-0.5 rounded">
                      {devicesList.length} Profiled
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/30 border-b border-gray-100 text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                          <th className="py-2.5 px-4">Device & OS</th>
                          <th className="py-2.5 px-4">Fingerprint MAC</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Last Connection IP</th>
                          <th className="py-2.5 px-4">GPS Geolocation</th>
                          <th className="py-2.5 px-4 text-center">Remote Access</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-brand-charcoal">
                        {devicesList.map(dev => (
                          <tr key={dev.id} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-3 px-4 font-bold">
                              <div>
                                <p className="font-bold text-xs">{dev.deviceName}</p>
                                <p className="text-[9px] text-gray-400 font-medium">{dev.operatingSystem} • {dev.browserName} • {dev.deviceType}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[9px] text-gray-400">
                              {dev.deviceFingerprint.substring(0, 16)}...
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                dev.status === "approved" 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                  : dev.status === "rejected"
                                    ? "bg-red-50 border-red-200 text-brand-red"
                                    : "bg-orange-50 border-orange-200 text-orange-600 animate-pulse"
                              }`}>
                                {dev.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[9px] text-gray-500">
                              {dev.lastIp || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {dev.latitude && dev.longitude ? (
                                <a 
                                  href={`http://maps.google.com/?q=${dev.latitude},${dev.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-red font-bold hover:underline flex items-center gap-0.5"
                                >
                                  📍 Link
                                </a>
                              ) : (
                                <span className="text-gray-400 text-[9px]">No Coordinates</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleRemote(dev.id)}
                                className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded transition-all active:scale-95 ${
                                  dev.allowRemote 
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                              >
                                {dev.allowRemote ? "Remote Allowed" : "Local Only"}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 shrink-0">
                              {dev.status !== "approved" && (
                                <button
                                  onClick={() => handleApproveDevice(dev.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9px] uppercase px-2 py-1 rounded transition-all active:scale-95 shadow-sm"
                                >
                                  Approve
                                </button>
                              )}
                              {dev.status !== "rejected" && (
                                <button
                                  onClick={() => handleRejectDevice(dev.id)}
                                  className="bg-brand-red hover:bg-brand-red/95 text-white font-extrabold text-[9px] uppercase px-2 py-1 rounded transition-all active:scale-95 shadow-sm"
                                >
                                  Block
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {devicesList.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-gray-400 text-xs py-8">
                              No hardware devices registered yet. Open counter mode on a tablet to connect.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6.7: PWA MARKETING AND CAMPAIGNS CONFIG */}
          {activeSubTab === "pwa" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h3 className="text-lg font-black tracking-tight text-brand-charcoal">PWA Customer Access Portal & Specials Settings</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Configure starting reward statuses and manage the specials broadcast message displayed on the customer-facing loyalty portal in real-time.
                </p>
              </div>

              {saveSettingsMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold text-center border ${
                  saveSettingsMessage.includes("Error") 
                    ? "bg-red-50 border-red-200 text-brand-red" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-600 animate-bounce"
                }`}>
                  {saveSettingsMessage}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* LEFT COLUMN: SETTINGS CONTROLS FORM */}
                <div className="space-y-6">
                  <form onSubmit={handleSaveSecuritySettings} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">PWA Proximity Specials</h4>
                      
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={safeGetSetting("pwa_marketing_enabled")?.value === "true"}
                          onChange={(e) => updateSettingStateValue("pwa_marketing_enabled", e.target.checked ? "true" : "false")}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-2 text-xs font-extrabold uppercase text-gray-500">
                          {safeGetSetting("pwa_marketing_enabled")?.value === "true" ? "ON" : "OFF"}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-extrabold text-brand-charcoal">
                        <span>Geofence Alert Radius</span>
                        <span className="bg-brand-red/10 text-brand-red px-2 py-0.5 rounded border border-brand-red/25 font-black font-mono">
                          {safeGetSetting("pwa_marketing_radius")?.value || "1.5"} Miles
                        </span>
                      </div>
                      
                      <input 
                        type="range"
                        min="1.0"
                        max="2.5"
                        step="0.1"
                        value={safeGetSetting("pwa_marketing_radius")?.value || "1.5"}
                        onChange={(e) => updateSettingStateValue("pwa_marketing_radius", e.target.value)}
                        className="w-full accent-brand-red h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[9px] text-gray-400 leading-snug">
                        Triggers a geofenced Cajun Specials popup alert once a day on customer devices when they load their dashboard within this store radius.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-brand-charcoal uppercase">Custom Specials Broadcast Message</label>
                      <textarea
                        rows={4}
                        maxLength={200}
                        value={safeGetSetting("pwa_marketing_alert_message")?.value || ""}
                        onChange={(e) => updateSettingStateValue("pwa_marketing_alert_message", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-brand-red text-brand-charcoal leading-relaxed shadow-inner"
                        placeholder="Enter the push notification message..."
                        required
                      />
                      <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                        <span>Cajun Marketing Broadcast Message</span>
                        <span>{200 - (safeGetSetting("pwa_marketing_alert_message")?.value || "").length} chars left</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saveSettingsLoading}
                      className="w-full gradient-red hover:opacity-95 text-white font-extrabold py-3 px-6 rounded-2xl shadow-lg shadow-brand-red/20 btn-animate text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {saveSettingsLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 fill-white/10" />
                      )}
                      <span>{saveSettingsLoading ? "Saving Broadcast Settings..." : "Save Specials Broadcast"}</span>
                    </button>
                  </form>

                  {/* CUSTOMER PORTAL CONFIG RULES CARD */}
                  <div className="bg-brand-charcoal text-white rounded-3xl p-5 border border-brand-red/25 shadow-md space-y-3">
                    <h4 className="font-extrabold text-xs text-brand-red uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-brand-red fill-brand-red" />
                      <span>Seeded Signup Access Rules</span>
                    </h4>
                    <p className="text-[10px] text-gray-300 leading-normal">
                      The user access portal displays their current status based on active store rules:
                    </p>
                    <ul className="text-[9px] space-y-2 text-gray-400 font-medium pl-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-red">🔥</span>
                        <span><strong>Starting Gift Balance:</strong> New guests automatically credit <strong>150 PTS</strong> to redeem their Free Boudin Ball.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-red">🔥</span>
                        <span><strong>Starting Tier Status:</strong> Set automatically to <strong>Rookie Roller</strong> with 0 initial visits check-ins.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-red">🔥</span>
                        <span><strong>Double Points Campaigns:</strong> Dynamic 2X markers automatically apply to linked specials on their portal.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE CUSTOMER ACCESS PORTAL PREVIEW */}
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span>📱</span> Real-Time Customer Portal Preview (New Signup Status)
                  </span>
                  
                  {/* PHONE FRAME MOCKUP */}
                  <div className="w-[305px] h-[550px] bg-brand-light rounded-[36px] border-[10px] border-brand-charcoal shadow-2xl relative overflow-hidden flex flex-col font-sans shrink-0 border-solid">
                    
                    {/* Simulated Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-3.5 bg-brand-charcoal rounded-b-xl z-50"></div>
                    
                    {/* Simulated App Header */}
                    <header className="bg-brand-charcoal text-white pt-6 pb-2.5 px-4 flex justify-between items-center shadow-md relative z-10 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-brand-red fill-brand-red" />
                        <span className="font-extrabold text-xs tracking-wider uppercase text-white">
                          Boudin <span className="text-brand-red">Boss</span>
                        </span>
                      </div>
                      <div className="bg-brand-red/10 border border-brand-red/30 px-2 py-0.5 rounded-full text-[9px] font-black text-brand-red flex items-center gap-0.5 border-solid">
                        <Zap className="w-2.5 h-2.5 fill-brand-red" />
                        <span>150 PTS</span>
                      </div>
                    </header>

                    {/* Scrollable Phone Body */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-4 relative z-0 text-left">
                      
                      {/* Greeting Hero Card */}
                      <div className="bg-gradient-to-r from-red-800 to-red-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden space-y-3">
                        <div className="absolute -top-3 -right-3 p-4 opacity-5">
                          <Flame className="w-20 h-20 text-brand-red fill-brand-red" />
                        </div>
                        
                        <div className="space-y-2 relative z-10">
                          <div>
                            <p className="text-brand-red font-bold text-[8px] uppercase tracking-wider">Cajun Loyalty Club</p>
                            <h2 className="text-xs font-extrabold leading-tight">Bonjour, Welcome back!</h2>
                            <p className="text-[9px] text-gray-300 font-medium">Boudreaux Thibodeaux</p>
                          </div>

                          <div className="flex gap-2">
                            <div className="bg-white/10 border border-white/5 rounded-xl p-1.5 flex-1 flex flex-col items-center border-solid">
                              <span className="text-[7px] text-gray-300 font-bold uppercase tracking-wider">Points</span>
                              <span className="text-xs font-black text-white flex items-center gap-0.5 mt-0.5">
                                <Zap className="w-3 h-3 text-brand-red fill-brand-red" />
                                150
                              </span>
                            </div>
                            <div className="bg-white/10 border border-white/5 rounded-xl p-1.5 flex-1 flex flex-col items-center border-solid">
                              <span className="text-[7px] text-gray-300 font-bold uppercase tracking-wider">Visits</span>
                              <span className="text-xs font-black text-white flex items-center gap-0.5 mt-0.5">
                                <Award className="w-3 h-3 text-brand-gold fill-brand-gold" />
                                0
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-brand-red text-center text-[9px] font-black py-1.5 rounded-lg uppercase tracking-wider opacity-90 shadow-sm flex items-center justify-center gap-1 cursor-pointer">
                            <span>🎫 Show My QR Code</span>
                          </div>
                        </div>
                      </div>

                      {/* Tier Crowns Status Card */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm space-y-2.5 border-solid">
                        <div className="flex gap-2.5 items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center text-lg shadow">
                            👑
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-[11px] tracking-tight text-brand-charcoal">Rookie Roller</span>
                              <span className="text-[7px] font-black bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-1 rounded border-solid">NEW</span>
                            </div>
                            <p className="text-[8px] text-gray-400 leading-tight">Welcome to the Bayou! Start earning free links basket.</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase text-gray-400 tracking-wider">
                            <span>Next: Bayou Buddy</span>
                            <span>0 / 10 Visits</span>
                          </div>
                          
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-red h-full rounded-full w-0"></div>
                          </div>
                          <p className="text-[8px] text-gray-400 leading-tight font-medium">
                            “Just 10 more visits to unlock Bayou Buddy!”
                          </p>
                        </div>
                      </div>

                      {/* Live specials Campaign Card */}
                      <div className="space-y-2">
                        <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">Live Specials Broadcast</p>
                        
                        <div className="bg-brand-charcoal text-white rounded-2xl p-3.5 shadow-md relative overflow-hidden border border-white/5 border-solid">
                          <div className="absolute top-2 right-2 bg-brand-red text-white text-[7px] font-black uppercase py-0.5 px-1.5 rounded-full flex items-center gap-0.5 shadow">
                            <Zap className="w-2 h-2 fill-white animate-pulse" />
                            <span>2X POINTS</span>
                          </div>
                          
                          <div className="space-y-1.5 relative z-10 pr-10">
                            <h4 className="font-black text-[10px] leading-tight text-white uppercase tracking-wider flex items-center gap-1">
                              <Flame className="w-3 h-3 text-brand-red fill-brand-red" />
                              <span>Smokehouse Special</span>
                            </h4>
                            <p className="text-[8px] text-gray-300 leading-normal font-medium">
                              {safeGetSetting("pwa_marketing_alert_message")?.value || "Configure your welcome specials message on the left to see it broadcasted here in real-time!"}
                            </p>
                            <div className="flex items-center gap-1 text-[7px] text-brand-red font-extrabold pt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping"></span>
                              <span>Broadcast Active Today</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Linked Loyalty Reward (Optional)</label>
                <select 
                  value={promoLinkedRewardId}
                  onChange={(e) => setPromoLinkedRewardId(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                >
                  <option value="">-- No Linked Reward --</option>
                  {rewardsList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.rewardType === 'points' ? `${r.pointsRequired} Pts` : r.rewardType === 'visit' ? `${r.visitsRequired} Visits` : `$${parseFloat(r.spendRequired).toFixed(0)} Spend`})
                    </option>
                  ))}
                </select>
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

      {/* MODAL 7: EDIT REWARD MODAL */}
      {showEditRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Edit Loyalty Reward</span>
              </h4>
              <button 
                onClick={() => { setShowEditRewardModal(false); setRewardFormError(null); setSelectedReward(null); }}
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

            <form onSubmit={handleEditReward} className="space-y-3">
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
                    id="editRewardHighValueCheck"
                    checked={rewardHighValue}
                    onChange={(e) => setRewardHighValue(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editRewardHighValueCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    High Value Flag
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="editRewardApprovalCheck"
                    checked={rewardManagerApproval}
                    onChange={(e) => setRewardManagerApproval(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editRewardApprovalCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Requires Manager PIN
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="editRewardActiveCheck"
                  checked={rewardActive}
                  onChange={(e) => setRewardActive(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="editRewardActiveCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                  Reward Active & Redeemable
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowEditRewardModal(false); setRewardFormError(null); setSelectedReward(null); }}
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

      {/* MODAL 8: EDIT PROMOTION MODAL */}
      {showEditPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-brand-red" />
                <span>Edit Shop Promotion</span>
              </h4>
              <button 
                onClick={() => { setShowEditPromoModal(false); setPromoFormError(null); setSelectedPromo(null); }}
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

            <form onSubmit={handleEditPromotion} className="space-y-3">
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Linked Loyalty Reward (Optional)</label>
                <select 
                  value={editPromoLinkedRewardId}
                  onChange={(e) => setEditPromoLinkedRewardId(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:border-brand-red text-brand-charcoal"
                >
                  <option value="">-- No Linked Reward --</option>
                  {rewardsList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.rewardType === 'points' ? `${r.pointsRequired} Pts` : r.rewardType === 'visit' ? `${r.visitsRequired} Visits` : `$${parseFloat(r.spendRequired).toFixed(0)} Spend`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="editFeaturedPromo"
                    checked={promoFeatured}
                    onChange={(e) => setPromoFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editFeaturedPromo" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Featured Banner
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="editDoublePointsPromo"
                    checked={promoDoublePoints}
                    onChange={(e) => setPromoDoublePoints(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="editDoublePointsPromo" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Trigger Double Points (2x)
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="editPromoActiveCheck"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="editPromoActiveCheck" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                  Promotion Active / Live
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowEditPromoModal(false); setPromoFormError(null); setSelectedPromo(null); }}
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

    </div>
  );
};
