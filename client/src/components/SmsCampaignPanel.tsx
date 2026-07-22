import React, { useCallback, useEffect, useState } from "react";
import type { AxiosError, AxiosInstance } from "axios";
import { MessageSquare, RefreshCw, Send, ShieldCheck } from "lucide-react";

interface SmsCampaignPanelProps {
  apiClient: AxiosInstance;
}

interface SmsStatus {
  configured: boolean;
  dryRun: boolean;
  optedInCustomers: number;
  maxRecipientsPerRun: number;
}

interface SmsCampaign {
  id: number;
  name: string;
  message: string;
  audienceType: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

interface CampaignPreview {
  eligibleRecipients: number;
  renderedMessage: string;
}

interface SendResult {
  dryRun: boolean;
  sentCount: number;
  failedCount: number;
}

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ error?: string }>).response?.data?.error || fallback;

export const SmsCampaignPanel: React.FC<SmsCampaignPanelProps> = ({ apiClient }) => {
  const [status, setStatus] = useState<SmsStatus | null>(null);
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<number, CampaignPreview>>({});

  const load = useCallback(async () => {
    try {
      const [statusResponse, campaignResponse] = await Promise.all([
        apiClient.get<SmsStatus>("/api/admin/sms/status"),
        apiClient.get<SmsCampaign[]>("/api/admin/sms/campaigns")
      ]);
      setStatus(statusResponse.data);
      setCampaigns(campaignResponse.data);
    } catch (error: unknown) {
      setActionMessage(errorMessage(error, "Unable to load SMS settings."));
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    // Remote data initialization; state updates occur only after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setActionMessage(null);
    try {
      await apiClient.post("/api/admin/sms/campaigns", { name, message, audienceType });
      setName("");
      setMessage("");
      setAudienceType("all");
      setActionMessage("Draft campaign created. Preview the audience before sending.");
      await load();
    } catch (error: unknown) {
      setActionMessage(errorMessage(error, "Campaign creation failed."));
    } finally {
      setSaving(false);
    }
  };

  const previewCampaign = async (id: number) => {
    try {
      const response = await apiClient.get<CampaignPreview>(`/api/admin/sms/campaigns/${id}/preview`);
      setPreviews(current => ({ ...current, [id]: response.data }));
    } catch (error: unknown) {
      setActionMessage(errorMessage(error, "Audience preview failed."));
    }
  };

  const sendCampaign = async (campaign: SmsCampaign) => {
    const mode = status?.dryRun ? "simulate" : "send LIVE";
    const confirmed = window.confirm(
      `Are you sure you want to ${mode} ?${campaign.name}?? Only customers with explicit SMS consent will be included.`
    );
    if (!confirmed) return;

    setSendingId(campaign.id);
    setActionMessage(null);
    try {
      const response = await apiClient.post<SendResult>(`/api/admin/sms/campaigns/${campaign.id}/send`);
      const result = response.data;
      setActionMessage(
        `${result.dryRun ? "Simulation" : "Send"} complete: ${result.sentCount} accepted, ${result.failedCount} failed.`
      );
      await load();
    } catch (error: unknown) {
      setActionMessage(errorMessage(error, "Campaign send failed."));
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><RefreshCw className="w-7 h-7 animate-spin text-brand-red" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-red" />
            SMS Campaigns
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Permission-based Twilio campaigns with opt-out and delivery tracking.
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-xs font-bold ${status?.dryRun ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <div>{status?.dryRun ? "Dry-run mode ? no texts leave the app" : "LIVE sending enabled"}</div>
          <div className="text-[10px] opacity-75 mt-1">
            {status?.optedInCustomers || 0} opted-in customers ? cap {status?.maxRecipientsPerRun}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl px-4 py-3 text-xs font-bold">
          {actionMessage}
        </div>
      )}

      <form onSubmit={createCampaign} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h4 className="text-sm font-black">Create campaign draft</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">The required STOP footer is appended automatically. Use {"{{first_name}}"} for personalization.</p>
        </div>
        <div className="grid md:grid-cols-[1fr_180px] gap-3">
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Campaign name"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
            maxLength={120}
            required
          />
          <select
            value={audienceType}
            onChange={event => setAudienceType(event.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
          >
            <option value="all">All opted-in members</option>
            <option value="rookie">Rookie tier</option>
            <option value="boss">Boss tier</option>
            <option value="vip">VIP spend segment</option>
            <option value="birthday">Birthdays this month</option>
            <option value="lapsed">No visit in 30 days</option>
          </select>
        </div>
        <textarea
          value={message}
          onChange={event => setMessage(event.target.value)}
          placeholder="Write the offer, reward update, or win-back message..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs min-h-24"
          maxLength={1000}
          required
        />
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-gray-400">{message.length}/1000 characters before footer</span>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-red text-white px-4 py-2 rounded-xl text-xs font-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-black">{campaign.name}</h4>
                  <span className="text-[9px] uppercase font-black bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    {campaign.status}
                  </span>
                  <span className="text-[9px] uppercase font-black bg-red-50 text-brand-red rounded-full px-2 py-0.5">
                    {campaign.audienceType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{campaign.message}</p>
                <p className="text-[10px] text-gray-400 mt-2">
                  {campaign.recipientCount || 0} recipients ? {campaign.sentCount || 0} accepted ? {campaign.failedCount || 0} failed
                </p>
                {previews[campaign.id] && (
                  <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-[10px] text-gray-600">
                    <div className="font-black">{previews[campaign.id].eligibleRecipients} eligible recipients</div>
                    <div className="mt-1 whitespace-pre-wrap">{previews[campaign.id].renderedMessage}</div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2">
                <button
                  onClick={() => previewCampaign(campaign.id)}
                  className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-[10px] font-black"
                >
                  Preview
                </button>
                {["draft", "failed"].includes(campaign.status) && (
                  <button
                    onClick={() => sendCampaign(campaign)}
                    disabled={sendingId === campaign.id}
                    className="bg-brand-charcoal text-white px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 disabled:opacity-50"
                  >
                    {status?.dryRun ? <ShieldCheck className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                    {sendingId === campaign.id ? "Working..." : status?.dryRun ? "Simulate" : "Send live"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-400 font-bold">
            No SMS campaign drafts yet.
          </div>
        )}
      </div>
    </div>
  );
};
