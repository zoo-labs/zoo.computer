// Zoo IAM OAuth 2.0 PKCE client
// Replaces Supabase auth entirely

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const IAM_URL = (import.meta.env.VITE_IAM_URL as string) || 'https://zoo.ngo'
const CLIENT_ID = (import.meta.env.VITE_IAM_CLIENT_ID as string) || 'app-computer'
const REDIRECT_URI = `${window.location.origin}/auth/callback`

const AUTHORIZE_URL = `${IAM_URL}/oauth/authorize`
const TOKEN_URL = `${IAM_URL}/oauth/token`
const USERINFO_URL = `${IAM_URL}/api/userinfo`

// ---------------------------------------------------------------------------
// Re-exported data types (unchanged from supabase.ts)
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  name: string
  company?: string
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

export interface RFQ {
  id: string
  user_id?: string
  company: string
  email: string
  phone?: string
  gpu_type: string
  quantity: number
  duration_months?: number
  use_case: string
  budget_range?: string
  additional_requirements?: string
  status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface ClusterRequest {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  company: string
  cluster_requirements: string
  number_of_gpus: string
  rental_duration: string
  project_description: string
  hear_about_us: string
  status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  rfq_id?: string
  cluster_request_id?: string
  user_id?: string
  quote_number: string
  items: any // JSON
  subtotal: number
  tax: number
  total: number
  payment_terms?: string
  valid_until?: string
  notes?: string
  status: 'sent' | 'viewed' | 'accepted' | 'expired' | 'rejected'
  created_at: string
  accepted_at?: string
}

export interface Order {
  id: string
  order_number: string
  user_id?: string
  quote_id?: string
  payment_intent_id?: string
  items: any // JSON
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'paid' | 'provisioning' | 'active' | 'cancelled'
  payment_method?: string
  billing_cycle?: string
  created_at: string
  paid_at?: string
  provisioned_at?: string
}

export interface Subscription {
  id: string
  user_id?: string
  order_id?: string
  subscription_id: string
  gpu_type: string
  quantity: number
  status: 'active' | 'cancelled' | 'past_due' | 'paused'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  cancelled_at?: string
}

export interface UsageRecord {
  id: string
  user_id: string
  reservation_id?: string
  gpu_type: string
  hours_used: number
  compute_units: number
  cost_usd: number
  timestamp: string
  metadata?: any
}

// ---------------------------------------------------------------------------
// Auth user type (what we decode from the JWT / userinfo)
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  name: string
  preferred_username?: string
  avatar?: string
  roles?: string[]
  owner?: string // org claim
}

export interface AuthSession {
  access_token: string
  refresh_token?: string
  expires_at?: number
  user: AuthUser
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zoo_access_token',
  REFRESH_TOKEN: 'zoo_refresh_token',
  EXPIRES_AT: 'zoo_expires_at',
  CODE_VERIFIER: 'zoo_code_verifier',
} as const

// ---------------------------------------------------------------------------
// PKCE helpers (no dependencies -- uses Web Crypto API)
// ---------------------------------------------------------------------------

function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await sha256(verifier)
  return base64UrlEncode(digest)
}

// ---------------------------------------------------------------------------
// JWT decoding (no validation -- server is the authority)
// ---------------------------------------------------------------------------

function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }
  const payload = parts[1]
  // Re-add base64 padding
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decoded)
}

function jwtToAuthUser(payload: Record<string, any>): AuthUser {
  return {
    id: payload.sub || payload.id || '',
    email: payload.email || '',
    name: payload.name || payload.preferred_username || payload.email || '',
    preferred_username: payload.preferred_username,
    avatar: payload.avatar || payload.picture,
    roles: payload.roles || payload.groups || [],
    owner: payload.owner || payload.org,
  }
}

// ---------------------------------------------------------------------------
// Auth state change listeners
// ---------------------------------------------------------------------------

type AuthStateCallback = (
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED',
  session: AuthSession | null
) => void

const listeners = new Set<AuthStateCallback>()

function notifyListeners(
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED',
  session: AuthSession | null
): void {
  listeners.forEach((cb) => {
    try {
      cb(event, session)
    } catch (err) {
      console.error('[auth] listener error:', err)
    }
  })
}

// ---------------------------------------------------------------------------
// Core auth functions
// ---------------------------------------------------------------------------

/** Redirect to IAM login with PKCE */
export async function signIn(): Promise<void> {
  const codeVerifier = generateRandomString(64)
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier)

  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: crypto.randomUUID(),
  })

  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`
}

/** Redirect to IAM signup page */
export function signUp(): void {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
  })

  window.location.href = `${IAM_URL}/signup?${params.toString()}`
}

/** Clear tokens and redirect to home */
export function signOut(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)

  notifyListeners('SIGNED_OUT', null)

  window.location.href = '/'
}

/** Exchange authorization code for tokens (called from /auth/callback) */
export async function handleCallback(code: string): Promise<AuthSession> {
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)
  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier. Auth flow may have expired.')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${text}`)
  }

  const data = await response.json()

  const accessToken: string = data.access_token
  const refreshToken: string | undefined = data.refresh_token
  const expiresIn: number = data.expires_in || 3600

  // Store tokens
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }
  const expiresAt = Date.now() + expiresIn * 1000
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt))

  // Clean up verifier
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)

  const user = jwtToAuthUser(decodeJwtPayload(accessToken))
  const session: AuthSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    user,
  }

  notifyListeners('SIGNED_IN', session)
  return session
}

/** Return the current session from stored tokens, or null */
export function getSession(): { data: { session: AuthSession | null } } {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!accessToken) {
    return { data: { session: null } }
  }

  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0')
  if (expiresAt > 0 && Date.now() > expiresAt) {
    // Token expired -- clear and return null
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
    return { data: { session: null } }
  }

  try {
    const user = jwtToAuthUser(decodeJwtPayload(accessToken))
    return {
      data: {
        session: {
          access_token: accessToken,
          refresh_token: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || undefined,
          expires_at: expiresAt || undefined,
          user,
        },
      },
    }
  } catch {
    return { data: { session: null } }
  }
}

/** Decode JWT and return user info, or null if not signed in */
export function getUser(): AuthUser | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!accessToken) return null

  try {
    return jwtToAuthUser(decodeJwtPayload(accessToken))
  } catch {
    return null
  }
}

/** Register a callback for auth state changes. Returns an unsubscribe handle. */
export function onAuthStateChange(
  callback: AuthStateCallback
): { data: { subscription: { unsubscribe: () => void } } } {
  listeners.add(callback)

  // Fire immediately with current state
  const { data: { session } } = getSession()
  if (session) {
    callback('SIGNED_IN', session)
  }

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          listeners.delete(callback)
        },
      },
    },
  }
}

/** Check if the current user has an admin role (from JWT claims) */
export function isAdmin(): boolean {
  const user = getUser()
  if (!user) return false
  return (user.roles || []).some(
    (r) => r === 'admin' || r === 'org:admin' || r === 'role:admin'
  )
}

/** Return the stored access token for API calls, or null */
export function getAccessToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return null

  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0')
  if (expiresAt > 0 && Date.now() > expiresAt) {
    return null
  }

  return token
}

/** Fetch full user profile from the IAM userinfo endpoint */
export async function fetchUserInfo(): Promise<AuthUser | null> {
  const token = getAccessToken()
  if (!token) return null

  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) return null

  const data = await response.json()
  return {
    id: data.sub || data.id || '',
    email: data.email || '',
    name: data.name || data.preferred_username || data.email || '',
    preferred_username: data.preferred_username,
    avatar: data.avatar || data.picture,
    roles: data.roles || data.groups || [],
    owner: data.owner || data.org,
  }
}

// ---------------------------------------------------------------------------
// Supabase-compatible shim
//
// Provides supabase.auth.getSession(), supabase.auth.onAuthStateChange(), etc.
// so existing page code can migrate incrementally.
// ---------------------------------------------------------------------------

export const supabase = {
  // Stub for code that still references supabase.from() -- these queries
  // must be migrated to Commerce API endpoints. Calling .from() at runtime
  // will log a warning and return empty results so the UI degrades gracefully.
  from: (table: string) => {
    const warn = () => {
      console.warn(`[auth] supabase.from('${table}') is deprecated. Migrate to Commerce API.`)
    }
    const emptyQuery: any = {
      select: (..._args: any[]) => { warn(); return emptyQuery },
      insert: (..._args: any[]) => { warn(); return emptyQuery },
      update: (..._args: any[]) => { warn(); return emptyQuery },
      delete: (..._args: any[]) => { warn(); return emptyQuery },
      eq: (..._args: any[]) => emptyQuery,
      neq: (..._args: any[]) => emptyQuery,
      gt: (..._args: any[]) => emptyQuery,
      gte: (..._args: any[]) => emptyQuery,
      lt: (..._args: any[]) => emptyQuery,
      lte: (..._args: any[]) => emptyQuery,
      not: (..._args: any[]) => emptyQuery,
      in: (..._args: any[]) => emptyQuery,
      order: (..._args: any[]) => emptyQuery,
      limit: (..._args: any[]) => emptyQuery,
      single: () => Promise.resolve({ data: null, error: { message: `supabase.from('${table}') is deprecated` } }),
      then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
    }
    return emptyQuery
  },
  // Stub for supabase.storage calls -- returns no-op
  storage: {
    from: (bucket: string) => {
      const warn = () => {
        console.warn(`[auth] supabase.storage.from('${bucket}') is deprecated. Migrate to Commerce API.`)
      }
      return {
        upload: async (..._args: any[]) => { warn(); return { data: null, error: { message: 'storage deprecated' } } },
        getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
        createSignedUrl: async (_path: string, _expiresIn: number) => ({ data: { signedUrl: '' }, error: null }),
      }
    },
  },
  auth: {
    getSession: async () => getSession(),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return onAuthStateChange((event, session) => {
        // Map to Supabase-style shape: session.user has { id, email, user_metadata }
        const mapped = session
          ? {
              access_token: session.access_token,
              user: {
                id: session.user.id,
                email: session.user.email,
                user_metadata: {
                  role: session.user.roles?.includes('admin') ? 'admin' : 'authenticated',
                  name: session.user.name,
                },
              },
            }
          : null
        callback(event, mapped)
      })
    },
    signInWithPassword: async (_creds: { email: string; password: string }) => {
      // Password auth goes through the IAM OAuth flow -- redirect there
      await signIn()
      // This never returns because we redirect, but satisfy the type:
      return { data: { user: null }, error: null }
    },
    signInWithOAuth: async (_opts: { provider: string; options?: { redirectTo?: string } }) => {
      await signIn()
      return { error: null }
    },
    signUp: async (_opts: { email: string; password: string; options?: { data?: any } }) => {
      signUp()
      return { data: { user: null }, error: null }
    },
    resetPasswordForEmail: async (_email: string, _opts?: { redirectTo?: string }) => {
      // Redirect to IAM password reset
      window.location.href = `${IAM_URL}/forget-password`
      return { error: null }
    },
    signOut: async () => {
      signOut()
      return { error: null }
    },
  },
}

// ---------------------------------------------------------------------------
// Default export: auth object with all methods
// ---------------------------------------------------------------------------

const auth = {
  signIn,
  signUp,
  signOut,
  getSession,
  getUser,
  handleCallback,
  onAuthStateChange,
  isAdmin,
  getAccessToken,
  fetchUserInfo,
}

export default auth
