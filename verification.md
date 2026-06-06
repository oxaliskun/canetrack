# User Verification — Implementation Prompts

## Phase 1: Database & Schema
Add fields to Prisma schema:
- `User`: `verificationStatus` (VerificationStatus enum: UNVERIFIED, VERIFIED)
- `User`: `verificationDoc` (String?, file path/URL)
- `User`: `verificationSelfie` (String?, file path/URL)
- `User`: `paNumber` — make it `@unique` and system-generated (uneditable after verification)
- `User`: remove `paNumber?`, replace with auto-generated `paNumber String? @unique`
- New enum: `VerificationStatus { UNVERIFIED, VERIFIED }`
- `npx prisma db push --accept-data-loss` + `npx prisma generate`

## Phase 2: Registration — Auto-Generate P.A. No.
In `POST /auth/register` (`src/server/api.ts`):
- Generate P.A. No. format: `PA-{year}-{random5digits}` (e.g. `PA-2026-08192`)
- Save to `user.paNumber` on creation
- Set `verificationStatus: 'UNVERIFIED'` by default
- Return `paNumber` and `verificationStatus` in response

## Phase 3: Sidebar — Unverified Gate
In `src/components/Sidebar.tsx`:
- If `user.verificationStatus === 'UNVERIFIED'`, only show:
  - Dashboard (read-only summary with verification banner)
  - My Account / Profile (for document upload)
- Hide all other links: Farms, Bagons, Quedans, Expenses, Payments, Reports
- Show a small badge/banner at the top: "Account Unverified — Complete verification to access all features"

## Phase 4: Route Guard — Lock Sections
In `src/App.tsx` or a new route wrapper component:
- Create `VerifiedRoute` component that checks `user.verificationStatus`
- If UNVERIFIED, redirect to Profile page (or Dashboard with verification notice)
- Apply to: `/dashboard/farms`, `/dashboard/bagons`, `/dashboard/quedans`, `/dashboard/expenses`, `/dashboard/payments`, `/dashboard/reports`

## Phase 5: Profile Page — Document Upload + Verification
In `src/pages/shared/Profile.tsx`:
- If `verificationStatus === 'UNVERIFIED'`:
  - Show large banner/alert: "Verify your account to unlock all features"
  - Document upload section:
    - **Valid ID** (file input, required) — preview
    - **Land Title / Land Document** (file input, optional) — preview
    - **Selfie holding ID** (file input, required) — preview
  - "Submit for Verification" button
- If `verificationStatus === 'VERIFIED'`:
  - Show green "Verified" badge
  - Display P.A. No. as read-only (uneditable)
- Remove previous editable P.A. No. text input (since it's auto-generated)

## Phase 6: Server API — Verify Route
In `src/server/api.ts`, add `PATCH /users/verify`:
- Accept multipart form with files: `validId`, `landDocument`, `selfie` (up to 3 files)
- Store file paths in `verificationDoc`, `verificationSelfie`
- Set `verificationStatus = 'VERIFIED'`
- Return updated user with `paNumber` and `verificationStatus`

## Phase 7: Dashboard — Verification Banner
In `src/pages/Dashboards.tsx`:
- If `user.verificationStatus === 'UNVERIFIED'`:
  - Show prominent banner at top: "⚠️ Your account is unverified. Upload your documents in Profile to unlock Farms, Bagons, Quedans, and more."
  - Hide all stat cards and charts (or show minimal read-only summary)
- If `user.verificationStatus === 'VERIFIED'`:
  - Normal dashboard display

## Phase 8: Seed Update
In `prisma/seed.ts`:
- Set existing test user (`farmer@test.com`) to `VERIFIED`
- Add placeholder `verificationDoc` and `verificationSelfie` paths if needed

---

> **Usage:** Feed me one phase at a time. I'll implement, commit, push, then wait for the next prompt.
