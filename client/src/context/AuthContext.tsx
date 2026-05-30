import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Default API Base URL setup
const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Helper to generate a stable, persistent device fingerprint
const getOrCreateDeviceFingerprint = () => {
  let fingerprint = localStorage.getItem("deviceFingerprint");
  if (!fingerprint) {
    // Generate a secure persistent device fingerprint (MAC-like hash style)
    const randomUUID = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgent = navigator.userAgent;
    const rawString = `${userAgent}-${screenInfo}-${randomUUID}`;
    
    // Hash it lightly or just use raw string for identification
    fingerprint = "DEV-" + btoa(rawString).replace(/[^a-zA-Z0-9]/g, "").substring(0, 24).toUpperCase();
    localStorage.setItem("deviceFingerprint", fingerprint);
  }
  return fingerprint;
};

// Set up Axios request interceptor for secure device whitelisting & geofencing headers
axios.interceptors.request.use(
  (config) => {
    // 1. Add device fingerprint header
    const fingerprint = getOrCreateDeviceFingerprint();
    config.headers["x-device-fingerprint"] = fingerprint;

    // 2. Add latitude/longitude headers if geofence geolocation is allowed/cached
    const cachedLat = localStorage.getItem("x-latitude");
    const cachedLng = localStorage.getItem("x-longitude");
    if (cachedLat && cachedLng) {
      config.headers["x-latitude"] = cachedLat;
      config.headers["x-longitude"] = cachedLng;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface AuthContextType {
  staffUser: any | null;
  customerUser: any | null;
  loading: boolean;
  loginStaff: (email: string, password: string) => Promise<any>;
  loginStaffWithPin: (pin: string) => Promise<any>;
  logoutStaff: () => Promise<void>;
  loginCustomer: (identifier: string) => Promise<any>;
  joinCustomer: (data: any) => Promise<any>;
  logoutCustomer: () => Promise<void>;
  refreshCustomer: () => Promise<any>;
  apiClient: typeof axios;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUser, setStaffUser] = useState<any | null>(null);
  const [customerUser, setCustomerUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize token state on startup
  useEffect(() => {
    // Request geolocation if available to enable geofencing checks
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem("x-latitude", pos.coords.latitude.toString());
          localStorage.setItem("x-longitude", pos.coords.longitude.toString());
        },
        (err) => {
          console.warn("Geolocation access denied or failed.", err);
        },
        { enableHighAccuracy: true }
      );
    }

    const initAuth = async () => {
      // Apply any saved tokens in localStorage to axios headers immediately on startup
      const staffToken = localStorage.getItem("staffToken");
      const customerToken = localStorage.getItem("customerToken");
      if (staffToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${staffToken}`;
      } else if (customerToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${customerToken}`;
      }

      try {
        // 1. Try to fetch staff user details
        const staffRes = await axios.get("/api/auth/me");
        if (staffRes.data?.user) {
          setStaffUser(staffRes.data.user);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Staff check failed, silent fail (either customer or not logged in)
      }

      try {
        // 2. Try to fetch customer details
        const custRes = await axios.get("/api/customers/me");
        if (custRes.data?.customer) {
          setCustomerUser(custRes.data);
        }
      } catch (e) {
        // Customer check failed, silent
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Staff Authentication Methods
  const loginStaff = async (email: string, password: string) => {
    const res = await axios.post("/api/auth/login", { email, password });
    if (res.data?.user) {
      setStaffUser(res.data.user);
      setCustomerUser(null); // Clear customer context if staff logs in
      if (res.data.token) {
        localStorage.setItem("staffToken", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }
    }
    return res.data;
  };

  const loginStaffWithPin = async (pin: string) => {
    const res = await axios.post("/api/auth/pin-login", { pin });
    if (res.data?.user) {
      setStaffUser(res.data.user);
      setCustomerUser(null); // Clear customer context if staff logs in
      if (res.data.token) {
        localStorage.setItem("staffToken", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }
    }
    return res.data;
  };

  const logoutStaff = async () => {
    await axios.post("/api/auth/logout");
    setStaffUser(null);
    localStorage.removeItem("staffToken");
    delete axios.defaults.headers.common["Authorization"];
  };

  // Customer Authentication Methods
  const loginCustomer = async (identifier: string) => {
    const res = await axios.post("/api/customers/login", { identifier });
    if (res.data?.customer) {
      if (res.data.token) {
        localStorage.setItem("customerToken", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }
      // Load full customer dashboard profile data
      const meRes = await axios.get("/api/customers/me");
      setCustomerUser(meRes.data);
      setStaffUser(null); // Clear staff context
    }
    return res.data;
  };

  const joinCustomer = async (formData: any) => {
    const res = await axios.post("/api/customers/join", formData);
    if (res.data?.customer) {
      if (res.data.token) {
        localStorage.setItem("customerToken", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }
      const meRes = await axios.get("/api/customers/me");
      setCustomerUser(meRes.data);
      setStaffUser(null);
    }
    return res.data;
  };

  const logoutCustomer = async () => {
    setCustomerUser(null);
    localStorage.removeItem("customerToken");
    delete axios.defaults.headers.common["Authorization"];
  };

  const refreshCustomer = async () => {
    const meRes = await axios.get("/api/customers/me");
    setCustomerUser(meRes.data);
    return meRes.data;
  };



  return (
    <AuthContext.Provider
      value={{
        staffUser,
        customerUser,
        loading,
        loginStaff,
        loginStaffWithPin,
        logoutStaff,
        loginCustomer,
        joinCustomer,
        logoutCustomer,
        refreshCustomer,
        apiClient: axios
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
