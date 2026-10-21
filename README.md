# CAS Digital Platform (Corporate Agri Sustainability)
### Adani Enterprises Ltd.

> A centralized, production-grade enterprise platform for digitizing, governing, and monitoring Corporate Agri Sustainability operations across Adani Group business units.

---

## 1. Architecture & Overview

The CAS Digital Platform replaces paper-bound, offline horticulture workflows with validated, traceable, and automated digital processes. Built on a clean, scalable monorepo architecture, the platform currently provides three core modules and is designed to host three additional future modules (**New Horticultural Projects**, **SLA**, and **Checklists**) without architectural rewrites.

### Technology Stack
- **Frontend (`/apps/web`):** React 18, Vite, TypeScript, Material UI (MUI v5), Emotion, TanStack Query, React Hook Form, Zod, Recharts, dayjs, react-i18next.
- **Backend (`/apps/api`):** Node.js 20+, NestJS (TypeScript), Shift (in-house SQLite storage layer built on the Node.js `node:sqlite` driver), OpenAPI/Swagger (`/api/docs`), Passport (OIDC SSO + Dev Login), Multer, ExcelJS, pdfmake, Nodemailer.
- **Shared (`/packages/shared`):** Pure TypeScript definitions for Indian Fiscal Year calculation utilities, area and manpower formulas, enums, workflow transitions, and DTOs.
- **Database:** SQLite (local file storage — 30 relational models, indices, foreign keys, and soft deletes). No external database server is required for local development.
- **Design System:** Custom Adani corporate theme tokens (`#FFFFFF` surfaces, `#158CC9` → `#2670DC` → `#443FFC` → `#A510A1` brand gradient, WCAG 2.1 AA accessible, Light/Dark mode, A-/A/A+ dynamic typography scaling, EN/HI language toggling, 44px touch targets).

---

## 2. Directory Layout

```
cas/
├── apps/
│   ├── api/                     # NestJS Backend API
│   │   ├── src/
│   │   │   ├── shift/           # SQLite storage layer (schema, service, seed, CLI)
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # SSO OIDC & Dev Login Strategy
│   │   │   │   ├── green-zone/  # Green Zone Creation, Mortality, Reports
│   │   │   │   ├── mis/         # Capex/Opex Budget & Expense Entries
│   │   │   │   ├── trees/       # 100M Trees Targets, Openings, Reports
│   │   │   │   ├── workflow/    # Generic Sequential Approval Engine
│   │   │   │   ├── masters/     # Organizational Hierarchy & Code Masters
│   │   │   │   ├── users/       # RBAC & Access Rights Mapping
│   │   │   │   ├── notifications/# In-app & Nodemailer SMTP Alerts
│   │   │   │   ├── jobs/        # Scheduled Approval & MIS Reminders
│   │   │   │   ├── files/       # Multi-file Upload & MIME Sniffing
│   │   │   │   └── settings/    # System Threshold Parameters
│   │   └── Dockerfile
│   └── web/                     # React 18 + Vite Frontend
│       ├── public/brand/        # Adani SVG brand assets
│       ├── src/
│       │   ├── api/             # Axios client with JWT interceptor
│       │   ├── components/      # AppLayout, Header, Sidebar, Badges, Modals
│       │   ├── context/         # AuthContext (Theme, Scale, Lang, User)
│       │   ├── features/        # Feature modules (Green Zone, MIS, Trees, Masters)
│       │   ├── i18n/            # English & Hindi translation catalogs
│       │   └── theme/           # Adani Theme Tokens & CSS variables
│       └── Dockerfile
├── packages/
│   └── shared/                  # Formulas, Fiscal Year math, RBAC enums
├── docker-compose.yml           # Redis, MailHog, API, Web
├── .env.example
└── README.md
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` in the root and in `apps/api/.env`:

```bash
cp .env.example .env
```

### Key Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend API port | `4000` |
| `SQLITE_PATH` | Local SQLite database file (relative to `apps/api`) | `./data/cas.db` |
| `JWT_SECRET` | Secret key for JWT sessions | `cas_secure_jwt_token_secret_key_2026` |
| `AUTH_MODE` | Authentication mode (`dev` or `sso`) | `dev` |
| `SSO_ISSUER_URL` | Microsoft Entra ID OpenID issuer | `https://login.microsoftonline.com/{tenant-id}/v2.0` |
| `SSO_CLIENT_ID` | Entra ID App Client ID | `your-azure-app-client-id` |
| `SSO_CLIENT_SECRET`| Entra ID App Secret | `your-azure-app-client-secret` |
| `SMTP_HOST` | Nodemailer SMTP server host | `localhost` (MailHog: `mailhog`) |
| `SMTP_PORT` | SMTP port | `1025` |

---

## 4. Running the Platform

### Option A: Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Build Shared Packages:**
   ```bash
   npm run build --workspace=@cas/shared
   ```

3. **Database Setup & Seeding:**
   ```bash
   npm run shift:setup --workspace=@cas/api   # create the SQLite schema
   npm run shift:seed  --workspace=@cas/api   # add the demo dataset
   # npm run shift:reset --workspace=@cas/api # wipe, recreate and reseed
   ```

4. **Start the Backend API:**
   ```bash
   npm run start:dev --workspace=@cas/api
   # API runs on http://localhost:4000/api/v1
   # Swagger Docs on http://localhost:4000/api/docs
   ```

5. **Start the Frontend App:**
   ```bash
   npm run dev --workspace=@cas/web
   # Portal runs on http://localhost:3000
   ```

### Option B: Docker Compose
```bash
docker compose up -d --build
```
- Web Portal: `http://localhost:3000`
- API & Swagger: `http://localhost:4000/api/docs`
- MailHog Web UI: `http://localhost:8025`

---

## 5. Demo Accounts (`AUTH_MODE=dev`)

When `AUTH_MODE=dev` is active, clicking **"Switch Persona / Dev Login"** in the user menu allows switching between standard personas without credentials:

| Persona | Name | Email | Role & Scope |
|---|---|---|---|
| **Site User** | Rajesh Kumar | `site.user@adani.com` | Site-level data entry for mapped locations (Mundra, Kawai) |
| **Site Supervisor** | Vikram Singh | `site.supervisor@adani.com` | Creator + **L1 Approver** for mapped locations |
| **BU Administrator** | Ananya Sharma | `bu.admin@adani.com` | **L2 Approver** for mapped businesses (Renewables, Agri) |
| **CAS Admin** | Pooja Mehta | `cas.admin@adani.com` | **L3 Approver**, Master data, User mapping, 100M Trees targets |

---

## 6. Business Rules & Calculation Formulas

### 6.1 Area Calculation Formula
Implemented in `@cas/shared` and reused on frontend and backend:
$$\text{Area (Ha.)} = \frac{\text{Quantity} \times \text{Row-to-Row (m)} \times \text{Plant-to-Plant (m)}}{10\,000}$$
- **Shrubs Area** uses the exact same formula.
- Ground Cover & Lawn uses direct manual entry in Hectares.
- **Overlap Rule:** If *"Does this plantation overlap with existing green cover?"* is checked, plant count is credited to 100M Trees and species counts, but area is excluded from total green cover.

### 6.2 Manpower Efficiency
$$\text{Manpower Efficiency} = \frac{\text{Male Workforce} + \text{Female Workforce}}{\text{Area in Hectares}}$$
*(Exported in MIS Excel reports; returns blank when Area is 0).*

### 6.3 Generic Sequential Workflow Engine
Transitions:
$$\text{L1 Site Supervisor} \longrightarrow \text{L2 BU Administrator} \longrightarrow \text{L3 CAS Admin} \longrightarrow \text{Complete}$$
- **Skip L1 Rule:** If the request creator is a **Site Supervisor**, the workflow automatically skips L1 and routes directly to L2.
- **Green Zone Actions:** Approvers can *Approve*, *Reject*, or *Return to Creator*. Creator can *Cancel* or *Callback* with mandatory remarks.
- **MIS Actions:** Approvers can *Approve* or *Reject*. Creator can *Cancel* only.
- Data is strictly read-only after submission.

### 6.4 100 Million Trees Calculation
- Counts include **Tree**, **Palm**, and **Mangrove** requests with status `Complete`.
- $\text{Completed Plantation FY} = \sum \text{Approved Plantations in FY} - \sum \text{Approved Mortalities in FY}$.
- $\text{Balance FY} = \text{Target FY} - \text{Completed FY}$ (negative values indicate over-achievement).
- $\text{Plantation Till Year Start} = \text{Opening Balance} + \text{Prior Net Completed}$.

---

## 7. Testing & Verification

### Running Automated Unit Tests
```bash
# Shared package tests (Area math, Fiscal Year, Manpower efficiency, Reminder schedules)
npm run test --workspace=@cas/shared

# Backend API tests (Sequential Workflow paths, Skip-L1 rule, Reject/Return/Callback/Cancel)
npm run test --workspace=@cas/api
```

### Triggering Scheduled Reminder Jobs Manually
To test reminders and inspect emails in MailHog without waiting 3 days:
```bash
# Approval reminders for pending requests > 3 days
curl -X POST http://localhost:4000/api/v1/jobs/trigger-approval-reminders

# MIS Yearly Budget entry reminders
curl -X POST http://localhost:4000/api/v1/jobs/trigger-mis-yearly-reminders

# MIS Monthly Expense entry reminders (3rd, 6th, 9th)
curl -X POST http://localhost:4000/api/v1/jobs/trigger-mis-monthly-reminders
```

---

## 8. Adding Future Modules (Architecture Guide)

The platform is architected to allow adding **New Horticultural Projects**, **SLA**, and **Checklists** seamlessly:

1. **Database:** Add module models in `apps/api/src/shift/schema.ts` linking to the existing `Business`, `Location`, and `WorkflowInstance` models, then run `npm run shift:setup --workspace=@cas/api`.
2. **Workflow:** Re-use `WorkflowService.createInstance(...)` and `WorkflowService.processAction(...)` by registering the new `entityType` (e.g. `'HORT_PROJECT'`).
3. **Module Switcher:** Add the new module identifier to `AppModule` in `AuthContext.tsx` and register its sidebar navigation items in `Sidebar.tsx`.
4. **API Routes:** Create a new NestJS module (e.g., `apps/api/src/modules/hort-projects/`) and import it into `app.module.ts`.

---

## 9. Compliance & Standards
- **Theme:** Adani Group corporate styling with pure CSS variables and responsive design down to 360px.
- **Security:** CSRF/CORS protection, JWT authentication, RBAC guards, input validation with class-validator/Zod, safe parameterized queries with the Shift SQLite layer.
- **Accessibility:** WCAG 2.1 AA compliant contrast ratios, visible focus indicators, dynamic font size switcher, and screen reader labels.
