import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, FileText, Calendar, DollarSign, User, Mail, ShieldAlert, ArrowLeft } from "lucide-react";
import axios from "axios";

export const ClaimPage: React.FC = () => {
  const { customerUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [receiptNumber, setReceiptNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseTotal, setPurchaseTotal] = useState("");
  const [claimantName, setClaimantName] = useState(
    customerUser ? `${customerUser.customer.firstName} ${customerUser.customer.lastName}` : ""
  );
  const [claimantEmail, setClaimantEmail] = useState(
    customerUser?.customer.email || ""
  );
  const [claimantPhone, setClaimantPhone] = useState(
    customerUser?.customer.phone || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!receiptNumber || !purchaseDate || !purchaseTotal || !claimantName) {
      setErrorMsg("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    if (!claimantEmail && !claimantPhone) {
      setErrorMsg("Please supply an Email or Phone number to link your claim.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/receipt-claims", {
        receiptNumber,
        purchaseDate,
        purchaseTotal,
        claimantName,
        claimantEmail: claimantEmail || undefined,
        claimantPhone: claimantPhone || undefined,
        rewardsNumber: customerUser?.loyalty.rewardsNumber || undefined
      });

      setSuccessMsg(res.data.message);
      
      // Clear forms
      setReceiptNumber("");
      setPurchaseTotal("");
      setPurchaseDate("");
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || "Failed to submit receipt claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-60px)] px-6 py-8 bg-white flex flex-col justify-center">
      
      {/* Header */}
      <div className="mb-6 relative">
        <Link 
          to={customerUser ? "/app/dashboard" : "/"}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-brand-red uppercase mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{customerUser ? "Dashboard" : "Back to Home"}</span>
        </Link>

        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-red" />
          <span>Claim Receipt Points</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Missing points from an in-store order? Submit your receipt number below for manual staff approval.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-2xl p-4 mb-6 space-y-2">
          <p className="font-extrabold text-sm">👍 Receipt Claim Logged</p>
          <p className="font-medium text-[11px] leading-relaxed">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-brand-red text-xs rounded-2xl p-4 mb-6 font-medium leading-relaxed">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-brand-light p-4 rounded-2xl border border-gray-100/50 space-y-3">
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Receipt Number *</label>
            <div className="relative">
              <input 
                type="text" 
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. 1-1002"
                className="w-full bg-white border border-gray-150 rounded-xl py-2.5 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
                required
              />
              <FileText className="absolute left-2.5 top-3 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Purchase Date *</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-white border border-gray-150 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
                  required
                />
                <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Receipt Total *</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  value={purchaseTotal}
                  onChange={(e) => setPurchaseTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-150 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
                  required
                />
                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-light p-4 rounded-2xl border border-gray-100/50 space-y-3">
          <p className="text-[10px] font-extrabold text-brand-charcoal uppercase tracking-wider">Account Validation Link</p>
          
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Full Name *</label>
            <div className="relative">
              <input 
                type="text" 
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-white border border-gray-150 rounded-xl py-2 px-3 pl-8 text-xs font-bold focus:outline-none focus:border-brand-red"
                required
              />
              <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Email</label>
              <input 
                type="email" 
                value={claimantEmail}
                onChange={(e) => setClaimantEmail(e.target.value)}
                placeholder="mail@example.com"
                className="w-full bg-white border border-gray-150 rounded-xl py-2.5 px-3 text-[11px] font-bold focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase mb-1">Phone</label>
              <input 
                type="tel" 
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                placeholder="Phone..."
                className="w-full bg-white border border-gray-150 rounded-xl py-2.5 px-3 text-[11px] font-bold focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full gradient-red hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-red/20 btn-animate text-xs mt-4 flex items-center justify-center gap-1.5"
        >
          {loading ? "Submitting Claim..." : "Submit Receipt for Review"}
        </button>
      </form>

      {/* Verification notice */}
      <div className="mt-6 flex items-start gap-2.5 text-[9px] text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-3">
        <ShieldAlert className="w-4 h-4 text-gray-400 shrink-0" />
        <p className="leading-snug">
          To prevent fraudulent submissions, duplicate receipt claims are flagged for security inspection, and manual approvals require matching the printed cashier number. All decisions are finalized within 24 hours.
        </p>
      </div>

    </div>
  );
};
