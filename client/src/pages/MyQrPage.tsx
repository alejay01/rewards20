import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Flame, QrCode, ShieldCheck, RefreshCw } from "lucide-react";
import axios from "axios";

export const MyQrPage: React.FC = () => {
  const { customerUser } = useAuth();
  const [qrDetails, setQrDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await axios.get("/api/customers/me/qr");
        setQrDetails(res.data);
      } catch (e) {
        console.error("Failed to load loyalty QR info:", e);
      } finally {
        setLoading(false);
      }
    };

    if (customerUser) {
      fetchQr();
    }
  }, [customerUser]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-brand-light">
        <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
        <span className="text-xs text-gray-500 mt-2 font-medium">Generating secure QR code...</span>
      </div>
    );
  }

  if (!qrDetails) return null;

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-100px)] px-4 py-8 bg-brand-light flex flex-col justify-between">
      
      {/* Branding Header */}
      <div className="text-center">
        <p className="text-brand-red font-bold text-[10px] uppercase tracking-widest mb-1">Cajun Scan & Earn</p>
        <h2 className="text-2xl font-black tracking-tight text-brand-charcoal">Show Your QR Code</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
          Present this secure code to our team member at the register when placing your order to collect points!
        </p>
      </div>

      {/* QR Display Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 max-w-xs mx-auto text-center space-y-6 my-8">
        
        {/* Secure Border */}
        <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 inline-block">
          <QRCodeSVG 
            value={qrDetails.publicQrToken}
            size={200}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "https://images.unsplash.com/photo-1544025162-d76694265947?w=80&fit=crop", // placeholder or logo later
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </div>

        {/* Account Details */}
        <div className="space-y-1 bg-brand-charcoal text-white rounded-2xl p-3 border border-white/5 shadow-inner">
          <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Rewards Member ID</p>
          <p className="text-sm font-black tracking-widest font-mono text-brand-red">
            {qrDetails.rewardsNumber}
          </p>
        </div>

        {/* Security disclaimer */}
        <div className="flex items-center gap-1.5 justify-center text-[9px] text-emerald-600 font-bold bg-emerald-50 py-1.5 px-3 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secured token rotated regularly for anti-fraud protection</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-brand-red/5 rounded-xl text-brand-red">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <p className="font-extrabold text-xs text-brand-charcoal">Quick Counter Ordering</p>
          <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
            Cashiers scan this using our tabletop accessory tablets. The server directly logs your visit and calculates eligible purchase points!
          </p>
        </div>
      </div>
    </div>
  );
};
