# SwiftDispatch — Production-Grade Delivery Management Platform

A mobile-first, software-native Delivery Management Web Application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase Auth & PostgreSQL**, and **Leaflet / OpenStreetMap**.

SwiftDispatch empowers logistics teams to manage products, draw and inspect delivery zones, select customer drop-off coordinates interactively, and validate orders using an authoritative server-side point-in-polygon eligibility engine.

---

## 🚀 Key Features

- **Staff Authentication & Session Protection:**
  - Secure email/password authentication backed by Supabase Auth and `@supabase/ssr`.
  - Next.js middleware protecting `/dashboard`, `/products`, `/delivery-zones`, and `/orders`.
  - Cookie-based session token rotation and automatic unauthenticated redirect handling.

- **Product Catalog Management (`/products`):**
  - Full CRUD operations: create, edit, toggle availability, and delete products.
  - Live stock tracking and category filtering.
  - Backed 100% by live Supabase PostgreSQL tables (no mock data fallbacks).

- **Interactive Delivery Zones Map (`/delivery-zones`):**
  - Leaflet + OpenStreetMap integration with dynamic SSR loading to prevent browser API hydration issues.
  - GeoJSON polygon rendering for active and inactive delivery perimeters.
  - Zone fee and status configuration with visual polygon highlighting.

- **Geofenced Order Creation & Eligibility Engine (`/orders`):**
  - **Location Pin Drop:** Click anywhere or drag the customer pin freely inside or outside zones.
  - **Dual-Layer Validation:** Immediate visual feedback badge on the client plus authoritative server-side validation.
  - **Ray-Casting Algorithm:** Built-in boundary edge/vertex inclusion rule (points on the boundary are treated as inside).
  - **Tamper-Proof Financials:** Order prices and subtotal calculations are pulled strictly from trusted database records, rejecting browser-manipulated prices.
  - **Atomic Persistence:** Creates orders (`validated` or `rejected`), records line items, and decrements available product stock atomically.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14.2 (App Router) |
| **Language** | TypeScript (Strict typechecking) |
| **Styling** | Tailwind CSS & PostCSS |
| **Icons** | Lucide React |
| **Database & Auth** | Supabase (PostgreSQL + Row-Level Security) |
| **Mapping Engine** | Leaflet, React-Leaflet, OpenStreetMap Tiles |
| **Deployment** | Vercel |

---

## 📂 Project Architecture

```
production-grade-delivery-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── delivery/check-eligibility/route.ts  # Authoritative point-in-polygon API
│   │   │   └── orders/create/route.ts               # Atomic order persistence & stock decrement
│   │   ├── dashboard/page.tsx                       # Metrics & dispatch overview
│   │   ├── delivery-zones/page.tsx                  # Interactive map & zone management
│   │   ├── login/page.tsx                           # Staff authentication portal
│   │   ├── orders/page.tsx                          # Order queue & line-item inspector
│   │   ├── products/page.tsx                        # Product catalog CRUD
│   │   ├── layout.tsx                               # Root HTML & metadata
│   │   └── page.tsx                                 # Landing redirect
│   ├── components/
│   │   ├── layout/                                  # AppLayout, Sidebar, Topbar, MobileNav
│   │   ├── map/                                     # DeliveryMap, DeliveryMapDynamic, LocationPicker
│   │   ├── order/                                   # OrderCreateModal with live map picker
│   │   └── ui/                                      # Button, Input, Modal, Badge, EmptyState
│   ├── lib/
│   │   ├── geo/
│   │   │   ├── normalize-polygon.ts                 # GeoJSON coordinate normalization
│   │   │   └── point-in-polygon.ts                  # Ray-casting algorithm with boundary rule
│   │   ├── supabase/                                # Browser, Server, and Middleware SSR clients
│   │   └── types/database.ts                        # Supabase TypeScript schema definitions
│   └── middleware.ts                                # Route guard & session validation
├── supabase/
│   └── migrations/
│       ├── 20261023000000_initial_schema.sql        # Database tables, triggers, and RLS
│       └── 20261023000001_fix_rls_and_confirm_email.sql # Public query permissions & auto-confirm
├── .env.example                                     # Safe environment variable template
└── package.json
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm or yarn
- A free [Supabase](https://supabase.com) account

### 2. Clone the Repository
```bash
git clone https://github.com/mohamedm999/production-grade-delivery-platform.git
cd production-grade-delivery-platform
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 5. Setup Supabase Database
1. Open your **Supabase Dashboard** > **SQL Editor**.
2. Run the migration script located at:
   [`supabase/migrations/20261023000000_initial_schema.sql`](supabase/migrations/20261023000000_initial_schema.sql)
3. Run the permissions and seed script located at:
   [`supabase/migrations/20261023000001_fix_rls_and_confirm_email.sql`](supabase/migrations/20261023000001_fix_rls_and_confirm_email.sql)

### 6. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

SwiftDispatch includes automated test suites covering unit logic and server endpoints:

```bash
# 1. Run ESLint audit
npm run lint

# 2. Run TypeScript strict type-check
npx tsc --noEmit

# 3. Run Delivery Eligibility Unit Tests (8/8 Test Cases)
npx tsx scratch/test_phase5_eligibility.js

# 4. Run API Integration Suite (10/10 Test Cases)
node scratch/test_order_creation_integration.js

# 5. Build for Production
npm run build
```

---

## 🚢 Deployment (Vercel)

1. Push your changes to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**.
5. In your **Supabase Dashboard** > **Authentication** > **URL Configuration**, add your Vercel deployment URL to **Site URL** and **Redirect URLs**.

---

## 🔒 Security & Best Practices

- **Zero Secrets Committed:** `.env.local` is git-ignored and only non-sensitive templates are tracked.
- **Server-Side Authorization:** Eligibility checks and product prices are verified on the server before committing orders.
- **Row-Level Security (RLS):** All Supabase tables (`profiles`, `products`, `delivery_zones`, `orders`, `order_items`) have explicit RLS policies enabled.

---

## 📄 License

This project is licensed under the MIT License.
