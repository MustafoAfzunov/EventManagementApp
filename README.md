# Event Management App (UCA)

ASP.NET Core 8 backend for the UCA Event Management platform. The backend is feature-complete across all four sprints:

- **Sprint 1** — public event discovery, authentication (JWT + email verification), user dashboard, event registration with waitlist
- **Sprint 2** — seating management (auto/manual) and digital ticketing (QR + PDF + email)
- **Sprint 3** — staff check-in via ticket/QR scan and attendance tracking
- **Sprint 4** — admin event management (CRUD, publish, cancel), venue management, registration approval/rejection, attendee export, and reporting & analytics

**Stack:** .NET 8 · C# · ASP.NET Core Web API · Entity Framework Core · Microsoft SQL Server · JWT authentication

This repository is the **API only**. CORS is enabled (see [CORS](#cors-frontend-access)) so a separate frontend (React, etc.) can call it directly.

## Solution structure

```
src/
  EventManagementApp.Domain/          Entities, enums
  EventManagementApp.Application/     DTOs, services, validators, repository interfaces
  EventManagementApp.Infrastructure/  EF Core, SQL Server, JWT, repositories
  EventManagementApp.API/             REST controllers, middleware, Swagger
```

Clean Architecture: Domain has no dependencies; Application defines contracts; Infrastructure implements persistence and auth; API is the HTTP entry point.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/) (recommended for SQL Server on Linux/macOS)
- Or a local/instance of **Microsoft SQL Server**

## Quick start

### 1. Start SQL Server

```bash
docker compose up -d
```

Default connection (see `appsettings.json`):

- Server: `localhost,1433`
- Database: `EventManagementAppDb`
- User: `sa`
- Password: `YourStrong@Passw0rd`

### 2. Run the API

Migrations run automatically on startup. On an **empty** database, sample data is seeded automatically (venues, seats, published/draft events, and three login accounts below). To disable seeding, set `"Seed": { "Enabled": false }` in `appsettings.json`.

```bash
cd src/EventManagementApp.API
dotnet run
```

Swagger UI: `http://localhost:5270/swagger` (port shown in console)

### Seeded accounts (development)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@uca.test` | `Admin@12345` |
| Event Staff | `staff@uca.test` | `Staff@12345` |
| Attendee | `attendee@uca.test` | `Attendee@12345` |

These accounts are pre-verified, so you can log in immediately via `POST /api/auth/login` without the email-verification step.

## Phase 1 API endpoints

### Public — Event discovery (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List published events (search, filter, paging) |
| GET | `/api/events/featured` | Featured events for landing |
| GET | `/api/events/upcoming` | Upcoming events |
| GET | `/api/events/{id}` | Event details (venue, speakers) |

**Query params for `/api/events`:** `search`, `category`, `venueId`, `fromDate`, `toDate`, `page`, `pageSize`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Sign up (creates unverified account, sends link) |
| GET | `/api/auth/verify-email?token=...` | Verify email address |
| POST | `/api/auth/resend-verification` | Resend verification link |
| POST | `/api/auth/login` | Login (requires verified email, returns JWT) |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Authenticated — Dashboard & profile

Requires header: `Authorization: Bearer {token}`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Current user profile |
| PUT | `/api/users/me` | Update profile |
| PUT | `/api/users/me/password` | Change password |
| GET | `/api/users/me/registrations` | My events |
| GET | `/api/users/me/notifications` | Notifications |
| PATCH | `/api/users/me/notifications/{id}/read` | Mark notification read |
| GET | `/api/dashboard/summary` | Dashboard counts |

### Registration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registrations` | Register for event |
| DELETE | `/api/registrations/{id}` | Cancel registration |

Registration flow: eligibility checks → confirmed if capacity available → waitlist if full. Cancelling a confirmed registration promotes the next waitlisted user. If an event has `requiresApproval`, new registrations are created as **Pending** and must be approved by an admin.

### Seating & ticketing

Requires `Authorization: Bearer {token}`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/{id}/seats` | Seat map with availability |
| POST | `/api/registrations/{id}/seat/auto` | Auto-assign a seat |
| POST | `/api/registrations/{id}/seat/select` | Manually select a seat |
| GET | `/api/tickets/{id}` | Ticket details |
| GET | `/api/tickets/{id}/pdf` | Download ticket PDF |
| POST | `/api/tickets/{id}/email` | Email the ticket |

### Check-in (Event Staff or Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/check-in/scan` | Validate a ticket code / QR payload and check in. Body: `{ "code": "EVT-...", "eventId": "(optional)" }` |
| GET | `/api/check-in/events/{eventId}/attendance` | Attendance list for an event |
| GET | `/api/check-in/events/{eventId}/stats` | Live check-in stats |

Scan result `status` values: `CheckedIn`, `AlreadyCheckedIn`, `NotFound`, `WrongEvent`, `Cancelled`, `InvalidRegistration`, `InvalidCode`.

### Admin — event & venue management (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List all events (any status; search, status filter, paging) |
| GET | `/api/admin/events/{id}` | Event detail (any status) |
| POST | `/api/admin/events` | Create event (draft) |
| PUT | `/api/admin/events/{id}` | Update event (incl. speakers) |
| POST | `/api/admin/events/{id}/publish` | Publish event |
| POST | `/api/admin/events/{id}/unpublish` | Return event to draft |
| POST | `/api/admin/events/{id}/cancel` | Cancel event (notifies registrants) |
| DELETE | `/api/admin/events/{id}` | Delete a draft/unused event (blocked if it has registrations) |
| GET | `/api/admin/venues` | List venues with seat/event counts |
| POST | `/api/admin/venues` | Create venue |
| PUT | `/api/admin/venues/{id}` | Update venue |
| POST | `/api/admin/venues/{venueId}/seats` | Bulk-create seats |
| PUT | `/api/admin/events/{eventId}/seating` | Configure event seating mode |

### Admin — registration management (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events/{eventId}/registrations` | List registrations (optional `?status=`) |
| POST | `/api/admin/registrations/{id}/approve` | Approve a pending registration |
| POST | `/api/admin/registrations/{id}/reject` | Reject a registration. Body: `{ "reason": "..." }` |
| GET | `/api/admin/events/{eventId}/registrations/export?format=csv\|pdf` | Export the attendee list |

### Admin — reporting & analytics (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports/registrations` | Registration counts per event (`?fromDate=&toDate=`) |
| GET | `/api/admin/reports/attendance` | Attendance vs. tickets issued, no-shows |
| GET | `/api/admin/reports/seat-occupancy` | Seat occupancy for seated events |
| GET | `/api/admin/reports/analytics` | Aggregate analytics & capacity utilization |
| GET | `/api/admin/reports/export?type=registrations\|attendance` | Export a report as CSV |

## CORS (frontend access)

CORS is enabled in `Program.cs`. By default (no origins configured) **any origin** is allowed, which is convenient for local frontend development. Authentication uses Bearer tokens (not cookies), so credentials are not required.

To lock CORS down to specific origins (recommended for production), add to `appsettings.json`:

```json
"Cors": {
  "AllowedOrigins": [ "http://localhost:5173", "https://your-frontend.example" ]
}
```

When `AllowedOrigins` is non-empty, only those origins are permitted (with credentials allowed).

## Manual migrations

```bash
dotnet ef migrations add MigrationName \
  --project src/EventManagementApp.Infrastructure \
  --startup-project src/EventManagementApp.API \
  --output-dir Persistence/Migrations

dotnet ef database update \
  --project src/EventManagementApp.Infrastructure \
  --startup-project src/EventManagementApp.API
```

## Configuration

`appsettings.json` sections:

- `ConnectionStrings:DefaultConnection` — SQL Server
- `Jwt` — Secret, Issuer, Audience, ExpiryMinutes
- `PasswordReset:TokenExpiryHours` — Reset token lifetime
- `EmailVerification` — Mailbox deliverability API (required for registration)

### Email verification (registration)

Registration follows the industry-standard **verify-by-link** flow:

```
User enters email → Format valid? → MX records valid? → Create Unverified account
    → Send verification email → User clicks link → Account Verified → Can login
```

| Step | Check | Error message |
|------|--------|----------------|
| 1 | RFC email format | `Invalid email format.` |
| 2 | DNS MX records | `Email domain does not exist.` |
| 3 | After register | Verification link sent (check API logs in dev) |
| 4 | Login before verify | `Please verify your email address before logging in.` |

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Creates unverified account, sends link |
| GET | `/api/auth/verify-email?token=...` | Activates account |
| POST | `/api/auth/resend-verification` | Resends verification link |

In development, configure SMTP to send real emails (see below).

Configure link base URL in `appsettings.json`:

```json
"App": { "BaseUrl": "http://localhost:5270" },
"EmailVerification": { "TokenExpiryHours": 24 }
```

### SMTP email setup (required for real emails)

Emails are sent via **SMTP** (MailKit). Add your settings to `appsettings.Development.json` or user secrets:

```json
"Smtp": {
  "Enabled": true,
  "Host": "smtp.gmail.com",
  "Port": 587,
  "Username": "your-email@gmail.com",
  "Password": "your-gmail-app-password",
  "FromEmail": "your-email@gmail.com",
  "FromName": "Event Management App UCA",
  "UseSsl": true
}
```

**Gmail:** use an [App Password](https://support.google.com/accounts/answer/185833) (not your normal Gmail password). Enable 2FA first.

**Outlook:** `smtp.office365.com`, port `587`.

Or via environment variables (recommended — do not commit passwords):

```bash
export Smtp__Username="your-email@gmail.com"
export Smtp__Password="your-app-password"
export Smtp__FromEmail="your-email@gmail.com"
```

If SMTP is not configured, registration still works but the verification link is only logged to the API console.

## Related docs

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for full module flows, diagrams, and the 4-sprint roadmap.
