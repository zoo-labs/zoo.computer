import auth from './auth';

// Commerce API configuration
const COMMERCE_API_URL = import.meta.env.VITE_COMMERCE_API_URL || 'https://billing.zoo.ngo';

// ── Types (same as supabase.ts) ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface RFQ {
  id: string;
  user_id?: string;
  company: string;
  email: string;
  phone?: string;
  gpu_type: string;
  quantity: number;
  duration_months?: number;
  use_case: string;
  budget_range?: string;
  additional_requirements?: string;
  status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ClusterRequest {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  cluster_requirements: string;
  number_of_gpus: string;
  rental_duration: string;
  project_description: string;
  hear_about_us: string;
  status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  rfq_id?: string;
  cluster_request_id?: string;
  user_id?: string;
  quote_number: string;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  payment_terms?: string;
  valid_until?: string;
  notes?: string;
  status: 'sent' | 'viewed' | 'accepted' | 'expired' | 'rejected';
  created_at: string;
  accepted_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  quote_id?: string;
  payment_intent_id?: string;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'provisioning' | 'active' | 'cancelled';
  payment_method?: string;
  billing_cycle?: string;
  created_at: string;
  paid_at?: string;
  provisioned_at?: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  order_id?: string;
  subscription_id: string;
  gpu_type: string;
  quantity: number;
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  cancelled_at?: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  reservation_id?: string;
  gpu_type: string;
  hours_used: number;
  compute_units: number;
  cost_usd: number;
  timestamp: string;
  metadata?: any;
}

// ── HTTP client ──────────────────────────────────────────────────────────────

async function commerceRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', body } = options;
  const token = await auth.getAccessToken();

  const url = `${COMMERCE_API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 404) {
    // Endpoint doesn't exist yet -- fail-open with null so callers can
    // return default/empty data.
    return null as T;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Commerce API ${method} ${path} failed (${res.status}): ${detail}`);
  }

  // 204 No Content or empty body
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

// ── RFQ functions ────────────────────────────────────────────────────────────

export const submitRFQ = async (
  rfqData: Omit<RFQ, 'id' | 'created_at' | 'updated_at' | 'status'>,
): Promise<RFQ> => {
  try {
    const data = await commerceRequest<RFQ>('/api/v1/order', {
      method: 'POST',
      body: {
        metadata: { type: 'rfq', ...rfqData },
        status: 'open',
      },
    });
    return data;
  } catch (err) {
    console.error('submitRFQ failed:', err);
    throw err;
  }
};

export const getUserRFQs = async (userId: string): Promise<RFQ[]> => {
  try {
    // Try metadata filter first; if Commerce doesn't support it, fetch all
    // orders and filter client-side.
    const data = await commerceRequest<any[]>(
      `/api/v1/order?userId=${encodeURIComponent(userId)}&metadata.type=rfq`,
    );
    if (data) return data as RFQ[];

    // Fallback: fetch all user orders and filter.
    const allOrders = await commerceRequest<any[]>(
      `/api/v1/order?userId=${encodeURIComponent(userId)}`,
    );
    if (!allOrders) return [];
    return allOrders.filter((o) => o.metadata?.type === 'rfq') as RFQ[];
  } catch (err) {
    console.error('getUserRFQs failed:', err);
    return [];
  }
};

export const submitClusterRequest = async (
  clusterData: Omit<ClusterRequest, 'id' | 'created_at' | 'updated_at' | 'status'>,
): Promise<ClusterRequest> => {
  try {
    const data = await commerceRequest<ClusterRequest>('/api/v1/order', {
      method: 'POST',
      body: {
        metadata: { type: 'cluster_request', ...clusterData },
        status: 'open',
      },
    });
    return data;
  } catch (err) {
    console.error('submitClusterRequest failed:', err);
    throw err;
  }
};

export const getAllClusterRequests = async (status?: string): Promise<ClusterRequest[]> => {
  try {
    let path = '/api/v1/order?metadata.type=cluster_request';
    if (status) {
      path += `&status=${encodeURIComponent(status)}`;
    }

    const data = await commerceRequest<any[]>(path);
    if (data) return data as ClusterRequest[];

    // Fallback: fetch all orders and filter client-side.
    const allOrders = await commerceRequest<any[]>('/api/v1/order');
    if (!allOrders) return [];
    let filtered = allOrders.filter((o) => o.metadata?.type === 'cluster_request');
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    return filtered as ClusterRequest[];
  } catch (err) {
    console.error('getAllClusterRequests failed:', err);
    return [];
  }
};

// ── Quote functions ──────────────────────────────────────────────────────────

export const getUserQuotes = async (userId: string): Promise<Quote[]> => {
  try {
    const data = await commerceRequest<Quote[]>(
      `/api/v1/billing/invoices?userId=${encodeURIComponent(userId)}&status=draft`,
    );
    return data ?? [];
  } catch (err) {
    console.error('getUserQuotes failed:', err);
    return [];
  }
};

export const createQuote = async (
  quoteData: Omit<Quote, 'id' | 'created_at' | 'status'>,
): Promise<Quote> => {
  try {
    const data = await commerceRequest<Quote>('/api/v1/billing/invoices', {
      method: 'POST',
      body: {
        ...quoteData,
        status: 'draft',
        created_at: new Date().toISOString(),
      },
    });
    return data;
  } catch (err) {
    console.error('createQuote failed:', err);
    throw err;
  }
};

export const getAllQuotes = async (status?: string): Promise<Quote[]> => {
  try {
    let path = '/api/v1/billing/invoices?status=draft';
    if (status) {
      path = `/api/v1/billing/invoices?status=${encodeURIComponent(status)}`;
    }
    const data = await commerceRequest<Quote[]>(path);
    return data ?? [];
  } catch (err) {
    console.error('getAllQuotes failed:', err);
    return [];
  }
};

export const updateQuoteStatus = async (
  id: string,
  status: Quote['status'],
): Promise<Quote> => {
  try {
    const data = await commerceRequest<Quote>(
      `/api/v1/billing/invoices/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: { status },
      },
    );
    return data;
  } catch (err) {
    console.error('updateQuoteStatus failed:', err);
    throw err;
  }
};

export const generateQuoteNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `Q${year}${month}-${random}`;
};

// ── Order functions ──────────────────────────────────────────────────────────

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const data = await commerceRequest<Order[]>(
      `/api/v1/order?userId=${encodeURIComponent(userId)}`,
    );
    return data ?? [];
  } catch (err) {
    console.error('getUserOrders failed:', err);
    return [];
  }
};

export const getAllRFQs = async (status?: string): Promise<RFQ[]> => {
  try {
    let path = '/api/v1/order?metadata.type=rfq';
    if (status) {
      path += `&status=${encodeURIComponent(status)}`;
    }

    const data = await commerceRequest<any[]>(path);
    if (data) return data as RFQ[];

    // Fallback: fetch all orders and filter client-side.
    const allOrders = await commerceRequest<any[]>('/api/v1/order');
    if (!allOrders) return [];
    let filtered = allOrders.filter((o) => o.metadata?.type === 'rfq');
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    return filtered as RFQ[];
  } catch (err) {
    console.error('getAllRFQs failed:', err);
    return [];
  }
};

export const updateRFQStatus = async (
  id: string,
  status: RFQ['status'],
): Promise<RFQ> => {
  try {
    const data = await commerceRequest<RFQ>(
      `/api/v1/order/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: { status, updated_at: new Date().toISOString() },
      },
    );
    return data;
  } catch (err) {
    console.error('updateRFQStatus failed:', err);
    throw err;
  }
};

export const updateClusterRequestStatus = async (
  id: string,
  status: ClusterRequest['status'],
): Promise<ClusterRequest> => {
  try {
    const data = await commerceRequest<ClusterRequest>(
      `/api/v1/order/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: { status, updated_at: new Date().toISOString() },
      },
    );
    return data;
  } catch (err) {
    console.error('updateClusterRequestStatus failed:', err);
    throw err;
  }
};

// ── Subscription functions ───────────────────────────────────────────────────

export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const data = await commerceRequest<Subscription[]>(
      `/api/v1/billing/subscriptions?userId=${encodeURIComponent(userId)}`,
    );
    return data ?? [];
  } catch (err) {
    console.error('getUserSubscriptions failed:', err);
    return [];
  }
};

// ── Usage / Analytics functions ──────────────────────────────────────────────

export const getUserUsage = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<UsageRecord[]> => {
  try {
    const data = await commerceRequest<UsageRecord[]>(
      `/api/v1/billing/meter-events/summary?userId=${encodeURIComponent(userId)}` +
        `&start=${encodeURIComponent(startDate.toISOString())}` +
        `&end=${encodeURIComponent(endDate.toISOString())}`,
    );
    return data ?? [];
  } catch (err) {
    console.error('getUserUsage failed:', err);
    return [];
  }
};

export const getUsageSummary = async (userId: string) => {
  try {
    const data = await commerceRequest<any[]>(
      `/api/v1/billing/meter-events/summary?userId=${encodeURIComponent(userId)}&dimensions=gpu_type`,
    );

    const summary = {
      totalHours: 0,
      totalCost: 0,
      totalComputeUnits: 0,
      byGpuType: {} as Record<string, { hours: number; cost: number; count: number }>,
    };

    if (!data) return summary;

    for (const record of data) {
      summary.totalHours += record.hours_used ?? 0;
      summary.totalCost += record.cost_usd ?? 0;
      summary.totalComputeUnits += record.compute_units ?? 0;

      const gpuType = record.gpu_type;
      if (gpuType) {
        if (!summary.byGpuType[gpuType]) {
          summary.byGpuType[gpuType] = { hours: 0, cost: 0, count: 0 };
        }
        summary.byGpuType[gpuType].hours += record.hours_used ?? 0;
        summary.byGpuType[gpuType].cost += record.cost_usd ?? 0;
        summary.byGpuType[gpuType].count++;
      }
    }

    return summary;
  } catch (err) {
    console.error('getUsageSummary failed:', err);
    return {
      totalHours: 0,
      totalCost: 0,
      totalComputeUnits: 0,
      byGpuType: {} as Record<string, { hours: number; cost: number; count: number }>,
    };
  }
};

export const getMonthlySpending = async (
  userId: string,
  months: number = 6,
): Promise<{ month: string; cost: number }[]> => {
  try {
    const data = await commerceRequest<any[]>(
      `/api/v1/billing/invoices?userId=${encodeURIComponent(userId)}&period=last_${months}_months`,
    );

    if (!data) return [];

    // Group by month
    const monthlySpending: Record<string, number> = {};

    for (const record of data) {
      const ts = record.timestamp || record.created_at;
      if (!ts) continue;
      const date = new Date(ts);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] ?? 0) + (record.cost_usd ?? record.total ?? 0);
    }

    return Object.entries(monthlySpending).map(([month, cost]) => ({ month, cost }));
  } catch (err) {
    console.error('getMonthlySpending failed:', err);
    return [];
  }
};

export const getGPUUtilization = async (
  userId: string,
): Promise<Record<string, number>> => {
  try {
    const records = await getUserUsage(
      userId,
      new Date(0), // all-time
      new Date(),
    );

    const utilization: Record<string, number> = {};

    for (const record of records) {
      utilization[record.gpu_type] = (utilization[record.gpu_type] ?? 0) + record.hours_used;
    }

    return utilization;
  } catch (err) {
    console.error('getGPUUtilization failed:', err);
    return {};
  }
};

export const saveUsageRecord = async (
  record: Omit<UsageRecord, 'id'>,
): Promise<UsageRecord> => {
  try {
    const data = await commerceRequest<UsageRecord>('/api/v1/billing/meter-events', {
      method: 'POST',
      body: record,
    });
    return data;
  } catch (err) {
    console.error('saveUsageRecord failed:', err);
    throw err;
  }
};

// ── Admin functions ──────────────────────────────────────────────────────────

export const checkAdminRole = async (_userId: string): Promise<boolean> => {
  try {
    return await auth.isAdmin();
  } catch (err) {
    console.error('checkAdminRole failed:', err);
    return false;
  }
};
