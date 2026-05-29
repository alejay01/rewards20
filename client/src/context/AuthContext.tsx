import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Default API Base URL setup
const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

interface AuthContextType {
  staffUser: any | null;
  customerUser: any | null;
  loading: boolean;
  loginStaff: (email: string, password: string) => Promise<any>;
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
    const initAuth = async () => {
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

  // On mount, apply any saved tokens in localStorage to axios headers
  useEffect(() => {
    const staffToken = localStorage.getItem("staffToken");
    const customerToken = localStorage.getItem("customerToken");
    if (staffToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${staffToken}`;
    } else if (customerToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${customerToken}`;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        staffUser,
        customerUser,
        loading,
        loginStaff,
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
