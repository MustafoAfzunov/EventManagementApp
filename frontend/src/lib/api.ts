// In dev, use same-origin /api (Vite proxies to the backend). In production, set VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:5270');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    Email: 'Email',
    Password: 'Password',
    FirstName: 'First name',
    LastName: 'Last name',
    '': 'Account',
  };
  return labels[field] ?? field;
}

function formatErrorMessage(body: unknown, status: number): { message: string; fieldErrors?: Record<string, string[]> } {
  const b = body as { message?: string; title?: string; errors?: Record<string, string[]> };
  const fieldErrors = b.errors && Object.keys(b.errors).length > 0 ? b.errors : undefined;

  if (fieldErrors) {
    const parts = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages.map((msg) => {
        const label = fieldLabel(field);
        if (label === 'Account' || field === '') return msg;
        if (msg.toLowerCase().includes(label.toLowerCase())) return msg;
        return `${label}: ${msg}`;
      }),
    );
    return { message: parts.join(' '), fieldErrors };
  }

  return {
    message:
      b.message ||
      b.title ||
      `Request failed (${status})`,
  };
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const isAuthEndpoint = path.startsWith('/api/auth/');
  const token = isAuthEndpoint ? null : localStorage.getItem('uca_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });

  if (res.status === 204) return {} as T;

  let body: unknown = {};
  try { body = await res.json(); } catch { /* no body */ }

  if (res.status === 401) {
    const message =
      (body as { message?: string })?.message ||
      'Session expired. Please log in again.';

    // Login/register failures are 401 too — show the real error, not "session expired".
    if (isAuthEndpoint) {
      throw new ApiError(401, message);
    }

    localStorage.removeItem('uca_token');
    localStorage.removeItem('uca_user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, message);
  }

  if (!res.ok) {
    const { message, fieldErrors } = formatErrorMessage(body, res.status);
    throw new ApiError(res.status, message, fieldErrors);
  }

  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ─── Frontend view models ───────────────────────────────────────────────────
export type SeatingMode = 'None' | 'Automatic' | 'Manual';
export type EventStatusName = 'Draft' | 'Published' | 'Cancelled' | 'Completed';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  capacity: number;
  description?: string;
  seatCount?: number;
  eventCount?: number;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  venue: Venue;
  capacity: number;
  seatsLeft: number;
  confirmed: number;
  pending?: number;
  seatingMode: SeatingMode;
  requiresApproval: boolean;
  status: EventStatusName;
  isFeatured: boolean;
  speakers: Speaker[];
}

export interface Seat {
  id: string;
  section: string;
  row: string;
  number: number;
  status: 'Available' | 'Held' | 'Assigned';
}

export interface Registration {
  id: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Rejected' | 'Waitlisted';
  registeredAt: string;
  ticketId?: string;
  seatLabel?: string;
  hasSeat: boolean;
  requiresSeating: boolean;
  waitlistPosition?: number;
  event: {
    id: string;
    title: string;
    category: string;
    startDate: string;
    endDate: string;
    imageUrl: string;
    venue: { name: string };
    seatingMode: SeatingMode;
  };
}

export interface AdminRegistration {
  id: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Rejected' | 'Waitlisted';
  waitlistPosition?: number;
  hasTicket: boolean;
  seatLabel?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface EventRegistrations {
  eventId: string;
  eventTitle: string;
  capacity: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  waitlistedRegistrations: number;
  registrations: AdminRegistration[];
}

export interface Ticket {
  id: string;
  registrationId: string;
  qrCode: string;
  ticketCode: string;
  attendeeName: string;
  status: string;
  issuedAt: string;
  seatLabel?: string;
  event: { id: string; title: string; startDate: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
}

export interface DashboardSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  waitlistedRegistrations: number;
  unreadNotifications: number;
}

export interface CheckInResult {
  success: boolean;
  status: string;
  message: string;
  attendeeName?: string;
  eventTitle?: string;
  seatLabel?: string;
  ticketCode?: string;
  checkedInAt?: string;
}

export interface CheckInStats {
  total: number;
  checkedIn: number;
  percentage: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
}

// ─── Raw backend DTO shapes (subset) ────────────────────────────────────────
interface RawAuthResponse {
  userId: string; email: string; firstName: string; lastName: string;
  role: string; isEmailVerified: boolean; accessToken: string; expiresAt: string;
}
interface RawVenue { id: string; name: string; address: string; city: string; country: string; }
interface RawSpeaker { id: string; name: string; bio: string; title: string; imageUrl?: string | null; }
interface RawEventListItem {
  id: string; title: string; description: string; category: string;
  startDate: string; endDate: string; capacity: number; confirmedRegistrations: number;
  availableSeats: number; isFeatured: boolean; venueName: string; venueCity: string; imageUrl?: string | null;
}
interface RawEventDetail {
  id: string; title: string; description: string; category: string; status: EventStatusName;
  startDate: string; endDate: string; capacity: number; confirmedRegistrations: number;
  availableSeats: number; isFeatured: boolean; requiresSeating: boolean; seatAssignmentMode: SeatingMode;
  requiresApproval: boolean; venue: RawVenue; speakers: RawSpeaker[]; imageUrl?: string | null;
}
interface RawAdminEventListItem {
  id: string; title: string; category: string; status: EventStatusName; startDate: string; endDate: string;
  capacity: number; confirmedRegistrations: number; pendingRegistrations: number; waitlistedRegistrations: number;
  isFeatured: boolean; requiresApproval: boolean; requiresSeating: boolean; venueName: string;
}
interface RawPaged<T> { items: T[]; page: number; pageSize: number; totalCount: number; }
interface RawRegistration {
  id: string; eventId: string; eventTitle: string; eventStartDate: string; eventEndDate: string;
  status: Registration['status']; waitlistPosition: number | null; createdAt: string;
  requiresSeating: boolean; hasSeatAssignment: boolean; seatLabel: string | null; ticketId: string | null;
  eventCategory: string; seatAssignmentMode: SeatingMode; venueName: string; eventImageUrl?: string | null;
}
interface RawSeat { id: string; section: string; row: string; number: string; status: string; }
interface RawSeatMap {
  eventId: string; venueId: string; requiresSeating: boolean; seatAssignmentMode: SeatingMode;
  sections: { name: string; rows: { name: string; seats: RawSeat[] }[] }[];
}
interface RawTicket {
  id: string; registrationId: string; eventId: string; eventTitle: string; eventStartDate: string;
  attendeeName: string; ticketCode: string; qrPayload: string; seatLabel: string | null;
  issuedAt: string; status: string;
}
interface RawNotification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
interface RawAdminRegItem {
  id: string; userId: string; attendeeName: string; attendeeEmail: string; status: AdminRegistration['status'];
  waitlistPosition: number | null; hasTicket: boolean; seatLabel: string | null; isCheckedIn: boolean;
  checkedInAt: string | null; rejectionReason: string | null; createdAt: string;
}
interface RawSeatAssignmentResult { registrationId: string; seatId: string; section: string; row: string; number: string; }

// ─── Mappers ────────────────────────────────────────────────────────────────
function mapEventList(d: RawEventListItem): Event {
  return {
    id: d.id, title: d.title, description: d.description, category: d.category,
    imageUrl: d.imageUrl ?? '', startDate: d.startDate, endDate: d.endDate,
    venue: { id: '', name: d.venueName, address: d.venueCity, city: d.venueCity, capacity: 0 },
    capacity: d.capacity, seatsLeft: d.availableSeats, confirmed: d.confirmedRegistrations,
    seatingMode: 'None', requiresApproval: false, status: 'Published',
    isFeatured: d.isFeatured, speakers: [],
  };
}

function mapEventDetail(d: RawEventDetail): Event {
  return {
    id: d.id, title: d.title, description: d.description, category: d.category,
    imageUrl: d.imageUrl ?? '', startDate: d.startDate, endDate: d.endDate,
    venue: {
      id: d.venue.id, name: d.venue.name, address: d.venue.address,
      city: d.venue.city, country: d.venue.country, capacity: 0,
    },
    capacity: d.capacity, seatsLeft: d.availableSeats, confirmed: d.confirmedRegistrations,
    seatingMode: d.seatAssignmentMode, requiresApproval: d.requiresApproval, status: d.status,
    isFeatured: d.isFeatured,
    speakers: (d.speakers ?? []).map((s) => ({
      id: s.id, name: s.name, role: s.title, bio: s.bio, imageUrl: s.imageUrl ?? '',
    })),
  };
}

function mapAdminEventList(d: RawAdminEventListItem): Event {
  return {
    id: d.id, title: d.title, description: '', category: d.category,
    imageUrl: '', startDate: d.startDate, endDate: d.endDate,
    venue: { id: '', name: d.venueName, address: '', capacity: 0 },
    capacity: d.capacity, seatsLeft: Math.max(0, d.capacity - d.confirmedRegistrations),
    confirmed: d.confirmedRegistrations, pending: d.pendingRegistrations,
    seatingMode: d.requiresSeating ? 'Manual' : 'None', requiresApproval: d.requiresApproval,
    status: d.status, isFeatured: d.isFeatured, speakers: [],
  };
}

function mapRegistration(d: RawRegistration): Registration {
  return {
    id: d.id, status: d.status, registeredAt: d.createdAt,
    ticketId: d.ticketId ?? undefined, seatLabel: d.seatLabel ?? undefined,
    hasSeat: d.hasSeatAssignment, requiresSeating: d.requiresSeating,
    waitlistPosition: d.waitlistPosition ?? undefined,
    event: {
      id: d.eventId, title: d.eventTitle, category: d.eventCategory,
      startDate: d.eventStartDate, endDate: d.eventEndDate, imageUrl: d.eventImageUrl ?? '',
      venue: { name: d.venueName }, seatingMode: d.seatAssignmentMode,
    },
  };
}

function mapSeatStatus(status: string): Seat['status'] {
  if (status === 'Available') return 'Available';
  if (status === 'Held') return 'Held';
  return 'Assigned'; // Assigned + Blocked => not selectable
}

function flattenSeatMap(map: RawSeatMap): Seat[] {
  const seats: Seat[] = [];
  for (const section of map.sections ?? []) {
    for (const row of section.rows ?? []) {
      for (const s of row.seats ?? []) {
        seats.push({
          id: s.id, section: s.section, row: s.row,
          number: parseInt(s.number, 10) || 0, status: mapSeatStatus(s.status),
        });
      }
    }
  }
  return seats;
}

function mapTicket(d: RawTicket): Ticket {
  return {
    id: d.id, registrationId: d.registrationId, qrCode: d.qrPayload, ticketCode: d.ticketCode,
    attendeeName: d.attendeeName, status: d.status, issuedAt: d.issuedAt,
    seatLabel: d.seatLabel ?? undefined,
    event: { id: d.eventId, title: d.eventTitle, startDate: d.eventStartDate },
  };
}

function mapNotificationKind(type: string): Notification['type'] {
  switch (type) {
    case 'RegistrationConfirmed':
    case 'RegistrationApproved':
    case 'WaitlistPromoted':
    case 'CheckedIn':
      return 'Success';
    case 'RegistrationCancelled':
    case 'RegistrationRejected':
    case 'EventCancelled':
      return 'Warning';
    default:
      return 'Info';
  }
}

function mapNotification(d: RawNotification): Notification {
  return {
    id: d.id, title: d.title, message: d.message, isRead: d.isRead,
    createdAt: d.createdAt, type: mapNotificationKind(d.type),
  };
}

function mapAdminRegistration(d: RawAdminRegItem): AdminRegistration {
  return {
    id: d.id, userId: d.userId, attendeeName: d.attendeeName, attendeeEmail: d.attendeeEmail,
    status: d.status, waitlistPosition: d.waitlistPosition ?? undefined, hasTicket: d.hasTicket,
    seatLabel: d.seatLabel ?? undefined, isCheckedIn: d.isCheckedIn,
    checkedInAt: d.checkedInAt ?? undefined, rejectionReason: d.rejectionReason ?? undefined,
    createdAt: d.createdAt,
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ');
  return { firstName, lastName: lastName || firstName };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await post<RawAuthResponse>('/api/auth/login', { email, password });
    return {
      token: res.accessToken,
      user: {
        id: res.userId,
        name: `${res.firstName} ${res.lastName}`.trim(),
        email: res.email,
        role: res.role,
        firstName: res.firstName,
        lastName: res.lastName,
        isEmailVerified: res.isEmailVerified,
      },
    };
  },
  register: (data: { name: string; email: string; password: string; ucaId?: string }) => {
    const { firstName, lastName } = splitName(data.name);
    return post<{ message: string }>('/api/auth/register', {
      email: data.email, password: data.password, firstName, lastName,
    });
  },
  forgotPassword: (email: string) =>
    post<{ message: string }>('/api/auth/forgot-password', { email }),
  verifyEmail: (token: string) =>
    get<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
};

// ─── Public events ──────────────────────────────────────────────────────────
export const events = {
  list: async (params?: Record<string, string | number>): Promise<PagedResult<Event>> => {
    const q = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const res = await get<RawPaged<RawEventListItem>>(`/api/events${q}`);
    return { items: res.items.map(mapEventList), total: res.totalCount, page: res.page, pageSize: res.pageSize };
  },
  featured: async (): Promise<Event[]> =>
    (await get<RawEventListItem[]>('/api/events/featured')).map(mapEventList),
  upcoming: async (): Promise<Event[]> =>
    (await get<RawEventListItem[]>('/api/events/upcoming')).map(mapEventList),
  get: async (id: string): Promise<Event> => mapEventDetail(await get<RawEventDetail>(`/api/events/${id}`)),
  seats: async (id: string): Promise<Seat[]> => flattenSeatMap(await get<RawSeatMap>(`/api/events/${id}/seats`)),
};

// ─── Attendee ─────────────────────────────────────────────────────────────────
export const dashboard = {
  summary: () => get<DashboardSummary>('/api/dashboard/summary'),
};

export const user = {
  me: async (): Promise<User> => {
    const u = await get<{ id: string; email: string; firstName: string; lastName: string; role: string; isEmailVerified: boolean }>('/api/users/me');
    return {
      id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email, role: u.role,
      firstName: u.firstName, lastName: u.lastName, isEmailVerified: u.isEmailVerified,
    };
  },
  update: (data: { name?: string }) => {
    const { firstName, lastName } = splitName(data.name ?? '');
    return put<unknown>('/api/users/me', { firstName, lastName });
  },
  changePassword: (current: string, newPass: string) =>
    put<void>('/api/users/me/password', { currentPassword: current, newPassword: newPass }),
  registrations: async (): Promise<Registration[]> =>
    (await get<RawRegistration[]>('/api/users/me/registrations')).map(mapRegistration),
  notifications: async (): Promise<Notification[]> =>
    (await get<RawNotification[]>('/api/users/me/notifications')).map(mapNotification),
  markNotificationRead: (id: string) =>
    patch<void>(`/api/users/me/notifications/${id}/read`),
};

export const registrations = {
  create: (eventId: string) => post<{ id: string; status: string; requiresSeatAssignment: boolean; ticketId?: string; message: string }>('/api/registrations', { eventId }),
  cancel: (id: string) => del<void>(`/api/registrations/${id}`),
  autoSeat: async (id: string): Promise<Seat> => {
    const r = await post<RawSeatAssignmentResult>(`/api/registrations/${id}/seat/auto`);
    return { id: r.seatId, section: r.section, row: r.row, number: parseInt(r.number, 10) || 0, status: 'Assigned' };
  },
  selectSeat: async (id: string, seatId: string): Promise<Seat> => {
    const r = await post<RawSeatAssignmentResult>(`/api/registrations/${id}/seat/select`, { seatId });
    return { id: r.seatId, section: r.section, row: r.row, number: parseInt(r.number, 10) || 0, status: 'Assigned' };
  },
};

export const tickets = {
  get: async (id: string): Promise<Ticket> => mapTicket(await get<RawTicket>(`/api/tickets/${id}`)),
  email: (id: string) => post<void>(`/api/tickets/${id}/email`),
  pdfUrl: (id: string) => `${BASE_URL}/api/tickets/${id}/pdf`,
  downloadPdf: async (id: string) => {
    const token = localStorage.getItem('uca_token');
    const res = await fetch(`${BASE_URL}/api/tickets/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = 'Failed to download ticket PDF.';
      try {
        const body = await res.json() as { message?: string };
        if (body.message) message = body.message;
      } catch { /* ignore */ }
      throw new ApiError(res.status, message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

// ─── Staff check-in ───────────────────────────────────────────────────────────
export const checkIn = {
  scan: (code: string, eventId?: string) =>
    post<CheckInResult>('/api/check-in/scan', { code, eventId: eventId || null }),
  attendance: (eventId: string) =>
    get<{ attendanceId: string; attendeeName: string; seatLabel: string | null; checkedInAt: string }[]>(`/api/check-in/events/${eventId}/attendance`),
  stats: async (eventId: string): Promise<CheckInStats> => {
    const s = await get<{ ticketsIssued: number; confirmedRegistrations: number; checkedIn: number; checkInRate: number }>(`/api/check-in/events/${eventId}/stats`);
    const total = s.ticketsIssued || s.confirmedRegistrations || 0;
    return { total, checkedIn: s.checkedIn, percentage: Math.round((s.checkInRate || 0) * 100) / 100 };
  },
};

// ─── Admin events ─────────────────────────────────────────────────────────────
export interface EventInput {
  title: string; description: string; category: string; imageUrl?: string;
  startDate: string; endDate: string; capacity: number; venueId: string;
  seatingMode: SeatingMode; requiresApproval: boolean; isFeatured?: boolean;
  speakers?: { name: string; bio: string; title: string; imageUrl?: string }[];
}

function toEventRequest(input: EventInput) {
  const requiresSeating = input.seatingMode !== 'None';
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    imageUrl: input.imageUrl || null,
    startDate: input.startDate,
    endDate: input.endDate,
    capacity: input.capacity,
    venueId: input.venueId,
    isFeatured: input.isFeatured ?? false,
    registrationOpensAt: null,
    registrationClosesAt: null,
    requiresSeating,
    seatAssignmentMode: requiresSeating ? input.seatingMode : 'None',
    requiresApproval: input.requiresApproval,
    speakers: input.speakers ?? [],
  };
}

export const adminEvents = {
  list: async (params?: Record<string, string>): Promise<PagedResult<Event>> => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await get<RawPaged<RawAdminEventListItem>>(`/api/admin/events${q}`);
    return { items: res.items.map(mapAdminEventList), total: res.totalCount, page: res.page, pageSize: res.pageSize };
  },
  get: async (id: string): Promise<Event> => mapEventDetail(await get<RawEventDetail>(`/api/admin/events/${id}`)),
  create: async (data: EventInput): Promise<Event> => mapEventDetail(await post<RawEventDetail>('/api/admin/events', toEventRequest(data))),
  update: async (id: string, data: EventInput): Promise<Event> => mapEventDetail(await put<RawEventDetail>(`/api/admin/events/${id}`, toEventRequest(data))),
  delete: (id: string) => del<void>(`/api/admin/events/${id}`),
  publish: (id: string) => post<void>(`/api/admin/events/${id}/publish`),
  unpublish: (id: string) => post<void>(`/api/admin/events/${id}/unpublish`),
  cancel: (id: string) => post<void>(`/api/admin/events/${id}/cancel`),
  registrations: async (id: string): Promise<EventRegistrations> => {
    const r = await get<{ eventId: string; eventTitle: string; capacity: number; confirmedRegistrations: number; pendingRegistrations: number; waitlistedRegistrations: number; registrations: RawAdminRegItem[] }>(`/api/admin/events/${id}/registrations`);
    return {
      eventId: r.eventId, eventTitle: r.eventTitle, capacity: r.capacity,
      confirmedRegistrations: r.confirmedRegistrations, pendingRegistrations: r.pendingRegistrations,
      waitlistedRegistrations: r.waitlistedRegistrations,
      registrations: (r.registrations ?? []).map(mapAdminRegistration),
    };
  },
  exportRegistrations: (id: string, format: 'csv' | 'pdf') =>
    `${BASE_URL}/api/admin/events/${id}/registrations/export?format=${format}`,
};

export const adminRegistrations = {
  approve: (id: string) => post<void>(`/api/admin/registrations/${id}/approve`),
  reject: (id: string, reason: string) =>
    post<void>(`/api/admin/registrations/${id}/reject`, { reason }),
};

export const adminVenues = {
  list: async (): Promise<Venue[]> => {
    const vs = await get<{ id: string; name: string; address: string; city: string; country: string; seatCount: number; eventCount: number }[]>('/api/admin/venues');
    return vs.map((v) => ({
      id: v.id, name: v.name, address: v.address, city: v.city, country: v.country,
      capacity: v.seatCount, seatCount: v.seatCount, eventCount: v.eventCount,
    }));
  },
  create: async (data: Partial<Venue>): Promise<Venue> => {
    const v = await post<{ id: string; name: string; address: string; city: string; country: string; seatCount: number; eventCount: number }>('/api/admin/venues', {
      name: data.name, address: data.address, city: data.city, country: data.country,
    });
    return { id: v.id, name: v.name, address: v.address, city: v.city, country: v.country, capacity: v.seatCount, seatCount: v.seatCount, eventCount: v.eventCount };
  },
  update: async (id: string, data: Partial<Venue>): Promise<void> => {
    await put<unknown>(`/api/admin/venues/${id}`, {
      name: data.name, address: data.address, city: data.city, country: data.country,
    });
  },
  createSeats: async (venueId: string, data: { section?: string; rows: string[]; seatsPerRow: number }): Promise<void> => {
    for (const row of data.rows) {
      await post<unknown>(`/api/admin/venues/${venueId}/seats`, {
        section: data.section || 'Main', row: row.trim(), seatCount: data.seatsPerRow, seatNumberPrefix: null,
      });
    }
  },
};

// ─── Admin reports ────────────────────────────────────────────────────────────
export interface RegistrationReport {
  generatedAt: string; eventCount: number; totalRegistrations: number;
  rows: { eventId: string; eventTitle: string; startDate: string; status: string; capacity: number; confirmed: number; pending: number; waitlisted: number; cancelled: number; rejected: number; total: number }[];
}
export interface AttendanceReport {
  generatedAt: string; eventCount: number;
  rows: { eventId: string; eventTitle: string; startDate: string; confirmed: number; ticketsIssued: number; checkedIn: number; noShows: number; attendanceRate: number }[];
}
export interface SeatOccupancyReport {
  generatedAt: string; eventCount: number;
  rows: { eventId: string; eventTitle: string; venueName: string; totalSeats: number; assignedSeats: number; availableSeats: number; occupancyRate: number }[];
}
export interface EventAnalytics {
  generatedAt: string; totalEvents: number; publishedEvents: number; draftEvents: number;
  cancelledEvents: number; completedEvents: number; totalRegistrations: number; totalConfirmed: number;
  totalWaitlisted: number; totalCheckedIn: number; averageCapacityUtilization: number; overallNoShowRate: number;
  events: { eventId: string; eventTitle: string; startDate: string; status: string; capacity: number; confirmed: number; checkedIn: number; capacityUtilization: number; noShowRate: number }[];
}

export const adminReports = {
  registrations: () => get<RegistrationReport>('/api/admin/reports/registrations'),
  attendance: () => get<AttendanceReport>('/api/admin/reports/attendance'),
  seatOccupancy: () => get<SeatOccupancyReport>('/api/admin/reports/seat-occupancy'),
  analytics: () => get<EventAnalytics>('/api/admin/reports/analytics'),
  exportUrl: (type: string) => `${BASE_URL}/api/admin/reports/export?type=${type}`,
};
