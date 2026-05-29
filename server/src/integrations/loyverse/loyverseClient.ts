import dotenv from "dotenv";
import { db } from "../../db";
import { integrationLogs } from "../../db/schema";

dotenv.config();

const LOYVERSE_API_KEY = process.env.LOYVERSE_API_KEY || "";
const LOYVERSE_API_BASE_URL = process.env.LOYVERSE_API_BASE_URL || "https://api.loyverse.com/v1.0";
const LOYVERSE_DEMO_MODE = process.env.LOYVERSE_DEMO_MODE !== "false"; // Default to true if not explicitly 'false'

export interface LoyverseCustomer {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  barcode?: string;
  points?: number;
}

export interface LoyverseReceipt {
  id: string;
  receiptNumber: string;
  total: number;
  receiptDate: string;
  customerId?: string;
}

export class LoyverseClient {
  private apiKey: string;
  private baseUrl: string;
  private demoMode: boolean;

  constructor() {
    this.apiKey = LOYVERSE_API_KEY;
    this.baseUrl = LOYVERSE_API_BASE_URL;
    this.demoMode = LOYVERSE_DEMO_MODE;
  }

  private async log(action: string, status: "success" | "failed", message: string, rawError?: any) {
    try {
      await db.insert(integrationLogs).values({
        integrationName: "loyverse",
        action,
        status,
        message,
        rawError: rawError ? JSON.stringify(rawError) : null
      });
    } catch (e) {
      console.error("Failed to write integration log:", e);
    }
  }

  // 1. Connection Test
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      await this.log("test_connection", "success", "Demo Connection succeeded (Loyverse Sandbox Mode).");
      return { success: true, message: "Demo Connection succeeded (Loyverse Sandbox Mode)." };
    }

    if (!this.apiKey) {
      return { success: false, message: "Loyverse API key is missing. Set LOYVERSE_API_KEY in .env." };
    }

    try {
      // Fetch a simple resource (e.g. stores or customers limit 1) to test credentials
      const response = await fetch(`${this.baseUrl}/stores?limit=1`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      await this.log("test_connection", "success", "Successfully connected to Loyverse Production API.");
      return { success: true, message: "Connected to Loyverse Production API successfully!" };
    } catch (error: any) {
      await this.log("test_connection", "failed", "Failed to connect to Loyverse API.", error.message);
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // 2. Fetch Customers
  async getCustomers(): Promise<LoyverseCustomer[]> {
    if (this.demoMode) {
      return [
        { id: "loyverse-cust-1", name: "Boudreaux Thibodeaux", email: "boudreaux@bayou.com", phoneNumber: "281-555-0101", barcode: "BAR-1001", points: 120 },
        { id: "loyverse-cust-2", name: "Clotile Hebert", email: "clotile@cajun.com", phoneNumber: "832-555-0202", barcode: "BAR-1002", points: 45 },
        { id: "loyverse-cust-3", name: "Alphonse Robichaux", email: "alphonse@smokehouse.com", phoneNumber: "713-555-0303", barcode: "BAR-1003", points: 80 },
        { id: "loyverse-cust-4", name: "Evangeline Arceneaux", email: "evangeline@gumbo.com", phoneNumber: "281-555-0404", barcode: "BAR-1004", points: 220 },
        { id: "loyverse-cust-5", name: "Remy Lebeau", email: "remy@boss.com", phoneNumber: "832-555-0505", barcode: "BAR-1005", points: 510 }
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/customers?limit=100`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch customers from Loyverse.");
      const data = await response.json() as any;

      return data.customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phoneNumber: c.phone_number,
        barcode: c.barcode,
        points: c.points
      }));
    } catch (error: any) {
      await this.log("fetch_customers", "failed", "Error pulling customers.", error.message);
      return [];
    }
  }

  // 3. Fetch Receipts
  async getReceipts(): Promise<LoyverseReceipt[]> {
    if (this.demoMode) {
      const today = new Date().toISOString();
      return [
        { id: "loyverse-receipt-1", receiptNumber: "1-1001", total: 18.50, receiptDate: today, customerId: "loyverse-cust-2" },
        { id: "loyverse-receipt-2", receiptNumber: "1-1002", total: 42.10, receiptDate: today, customerId: "loyverse-cust-3" },
        { id: "loyverse-receipt-3", receiptNumber: "1-1003", total: 125.50, receiptDate: today, customerId: "loyverse-cust-5" },
        { id: "loyverse-receipt-4", receiptNumber: "1-1004", total: 8.90, receiptDate: today },
        { id: "loyverse-receipt-5", receiptNumber: "1-1005", total: 55.00, receiptDate: today }
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/receipts?limit=50`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch receipts from Loyverse.");
      const data = await response.json() as any;

      return data.receipts.map((r: any) => ({
        id: r.id,
        receiptNumber: r.receipt_number,
        total: r.total_money,
        receiptDate: r.created_at,
        customerId: r.customer_id
      }));
    } catch (error: any) {
      await this.log("fetch_receipts", "failed", "Error pulling receipts.", error.message);
      return [];
    }
  }
}

export const loyverseClient = new LoyverseClient();
