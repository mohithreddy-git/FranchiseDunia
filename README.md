# FranchiseDunia — Enterprise Franchise & Investment Marketplace

FranchiseDunia is an end-to-end investment and business expansion marketplace connecting verified franchise brands, investors, business buyers/sellers, and event organizers across India.

---

## 🛠️ Technology Stack & Architecture

- **Frontend:** Next.js (App Router, Server Components, TypeScript Strict, Tailwind CSS)
- **Backend API:** Node.js + Express.js REST APIs (Modular Controllers, Middlewares, Zod Validations)
- **Database:** MongoDB (Mongoose Schema Architecture) with automatic in-memory fallback (`mongodb-memory-server`) in development when `MONGODB_URI` is unset.
- **State Management & Data Fetching:** TanStack Query (React Query) + Zustand
- **Security & Auth:** JWT tokens stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies with 7-day token rotation, helmet, express-rate-limit, express-mongo-sanitize, hpp, and strict IDOR protection.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+

### 2. Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Seed database with 26+ realistic franchise opportunities & demo accounts
npm run seed

# 4. Run automated test suite
npm test

# 5. Start API server on http://localhost:5001
npm start
# (or 'npm run dev' with nodemon)
```

> **Note on Database Zero-Config:**
> In development (`NODE_ENV=development`), if `MONGODB_URI` is not provided in `.env`, the backend automatically boots an in-memory MongoDB server (`mongodb-memory-server`) with zero external database installation required.
> In production (`NODE_ENV=production`), missing or unreachable `MONGODB_URI` immediately crashes the process at startup with a fatal log.

---

### 3. Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Build production bundle (Zero TypeScript/ESLint errors)
npm run build

# 4. Start Next.js on http://localhost:3000
npm run dev
```

---

## 🔒 Demo Evaluation Accounts

When `ENABLE_DEMO_MODE=true` in `backend/.env`, 1-click evaluation buttons are enabled on the frontend login page (`/auth/login`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Investor** | `demo_investor@franchisedunia.in` | `Password123!` |
| **Brand Owner** | `demo_brand_owner@franchisedunia.in` | `Password123!` |
| **Business Seller** | `demo_business_seller@franchisedunia.in` | `Password123!` |
| **Event Organizer** | `demo_event_organizer@franchisedunia.in` | `Password123!` |
| **Admin** | `admin@franchisedunia.in` | `AdminSecure2025!` |

---

## 🧪 Definition of Done Verification

### Backend Tests
```bash
cd backend
npm test
```
All 16 Jest + Supertest suites pass:
- Environment & Database rules (dev fallback vs prod crash)
- Auth cookies & token rotation
- Prevention of `admin` registration
- Franchise multi-facet filtering (industry, investment range, city)
- IDOR ownership validation (403 when unrelated brand owner attempts to read or mutate another brand owner's leads)

### Frontend Build
```bash
cd frontend
npm run build
```
Builds Next.js 14 App Router cleanly with strict TypeScript and ESLint.
