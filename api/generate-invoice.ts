import { generateInvoicePDF } from '../src/components/Invoice';
import {
  createInvoiceFromOrder,
  createInvoiceFromSubscription,
  storeInvoice,
} from '../src/lib/invoices';
import type { InvoiceData } from '../src/lib/invoices';

// Commerce API configuration (server-side)
const COMMERCE_API_URL = process.env.VITE_COMMERCE_API_URL || 'https://billing.zoo.ngo';

async function commerceFetch<T>(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T | null> {
  const { method = 'GET', body, token } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${COMMERCE_API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

interface RequestBody {
  type: 'order' | 'subscription' | 'invoice';
  id: string;
  regenerate?: boolean;
  period?: {
    start: string;
    end: string;
  };
}

interface Response {
  success: boolean;
  data?: {
    invoiceId: string;
    invoiceNumber: string;
    pdfUrl: string;
    downloadUrl?: string;
  };
  error?: string;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const body: RequestBody = await req.json();
    const { type, id, regenerate = false, period } = body;

    // Extract bearer token from request for Commerce API passthrough
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!type || !id) {
      return {
        success: false,
        error: 'Missing required parameters: type and id',
      };
    }

    let invoiceData: InvoiceData;

    switch (type) {
      case 'order': {
        const order = await commerceFetch<any>(`/api/v1/order/${id}`, { token });
        if (!order) {
          return { success: false, error: 'Order not found' };
        }
        invoiceData = await createInvoiceFromOrder(order, order.user || {});
        break;
      }

      case 'subscription': {
        const subscription = await commerceFetch<any>(`/api/v1/billing/subscriptions/${id}`, { token });
        if (!subscription) {
          return { success: false, error: 'Subscription not found' };
        }

        const invoicePeriod = period
          ? { start: new Date(period.start), end: new Date(period.end) }
          : {
              start: new Date(subscription.current_period_start),
              end: new Date(subscription.current_period_end),
            };

        invoiceData = await createInvoiceFromSubscription(subscription, subscription.user || {}, invoicePeriod);
        break;
      }

      case 'invoice': {
        const invoice = await commerceFetch<any>(`/api/v1/billing/invoices/${id}`, { token });
        if (!invoice) {
          return { success: false, error: 'Invoice not found' };
        }

        if (!regenerate && invoice.pdf_url) {
          return {
            success: true,
            data: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              pdfUrl: invoice.pdf_url,
            },
          };
        }

        invoiceData = {
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.created_at,
          dueDate: invoice.due_date,
          status: invoice.status,
          company: {
            name: 'Zoo Computer',
            address: '2100 Geng Road',
            city: 'Palo Alto',
            state: 'CA',
            zip: '94303',
            country: 'United States',
            email: 'billing@zoo.computer',
            phone: '+1 (650) 555-0100',
            website: 'https://zoo.computer',
          },
          customer: invoice.customer_info || {
            name: invoice.user?.name,
            company: invoice.user?.company,
            email: invoice.user?.email,
          },
          lineItems: invoice.line_items || [],
          subtotal: invoice.subtotal || invoice.amount_due,
          taxRate: 0.0875,
          tax: invoice.tax || 0,
          total: invoice.amount_due + (invoice.amount_paid || 0),
          amountPaid: invoice.amount_paid || 0,
          amountDue: invoice.amount_due,
          paymentMethod: invoice.payment_method,
          paymentTerms: invoice.billing_cycle === 'monthly' ? 'Net 30' : 'Due on receipt',
          paidAt: invoice.paid_at,
          orderId: invoice.order_id,
          subscriptionId: invoice.subscription_id,
          externalInvoiceId: invoice.external_invoice_id,
        };
        break;
      }

      default:
        return { success: false, error: 'Invalid type. Must be order, subscription, or invoice' };
    }

    // Generate PDF
    const pdfBlob = await generateInvoicePDF(invoiceData);

    // Store invoice via Commerce API
    const storedInvoice = await storeInvoice(invoiceData, '');

    return {
      success: true,
      data: {
        invoiceId: storedInvoice.id,
        invoiceNumber: invoiceData.invoiceNumber,
        pdfUrl: '',
      },
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}
