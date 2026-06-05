# Canetrack Refactoring — Phase Prompts (v2)

I-prompt lang ning isa-isa sa AI. Complete ang usa ka phase before mag-next.

---

## Phase 1: Full Schema Cleanup

**Prompt:**

> Refactor the Prisma schema for a farmer-only sugarcane tracking system. Make ALL these changes to `prisma/schema.prisma`:
>
> ### 1. Rename model `Truck` → `Bagon`
> - Remove fields: `make`, `model`, `capacity`, `color`
> - Add field: `type String @default("18ft")`
> - Keep: `id`, `plateNumber` (unique), `tareWeight Float?`, `ownerId`, `isArchived`, `createdAt`, `updatedAt`
> - Update relation: `tickets WeightTicket[]`
>
> ### 2. Remove these entire models
> `SugarcaneVariant`, `SugarType`, `Pricing`, `ReconciliationRecord`, `AuditLog`, `Notification`, `VerificationDocument`, `SystemSettings`
>
> ### 3. Simplify model `User`
> - Remove fields: `role`, `isActive`, `emailVerified`, `verificationCode`, `verificationStatus`, `rejectionReason`, `verifiedAt`, `verifiedBy`
> - Remove relations: `reconciliations`, `auditLogs`, `notifications`, `verificationDocuments`, `trucks`
> - Keep: `id`, `name`, `email`, `passwordHash`, `contactNumber`, `address`, `profilePicture`, `assignedMill`, `createdAt`, `updatedAt`, `farms`, `tickets`, `expenses`
>
> ### 4. Simplify model `Farm`
> - Remove fields: `verificationStatus`, `rejectionReason`
>
> ### 5. Simplify model `WeightTicket`
> - Remove fields: `truckPlate`, `pricePerKg`, `totalValue`, `truckId`, `verifiedAt`, `verifiedBy`, `sugarTypeId`, `variantId`, `disputeNotes`, `disputePhotoUrl`, `disputeFinal`, `adjustedWeight`, `adjustedPrice`
> - Add field: `bagonId String`
> - Add field: `netWeight Float @default(0)`
> - Change status comment to: `// PENDING, PAID`
> - Add relation: `bagon Bagon? @relation(fields: [bagonId], references: [id])`
> - Remove relations: `reconciliation`, `sugarType`, `variant`, `truck`
>
> ### 6. Simplify model `ExpenseCategory`
> - Remove field: `type`
>
> ### 7. After all changes
> Run: `npx prisma generate && npx prisma db push --accept-data-loss`
>
> Return the final schema content and confirm push succeeded.

---

## Phase 2: Update seed.ts for New Schema

**Prompt:**

> Update `prisma/seed.ts` to match the new schema (after Phase 1):
>
> ### Changes:
> - Remove `role: 'FARMER'` from user data (field removed)
> - Remove `verificationStatus: 'VERIFIED'` from user data (field removed)
> - Remove `isActive: true` from update data (field removed)
> - Rename `contactNumber` → keep as is (field not renamed)
> - Remove `type` field from expense categories (field removed)
> - Keep: 1 farmer user, 3 farms, 10 expense categories (without type)
>
> Run: `npx prisma db seed`
>
> Return the updated seed.ts content.

---

## Phase 3: Update useAuth.ts

**Prompt:**

> Update `src/hooks/useAuth.ts` to match the new User schema:
>
> ### Changes:
> - Remove `role: string` from the User interface
> - Remove `verificationStatus?: string` from the User interface
> - Remove `rejectionReason?: string` from the User interface
> - Keep `contactNumber` as-is (not renamed)
> - Keep all other fields
>
> Return the updated content.

---

## Phase 4: Remove All Admin + Unused Pages

**Prompt:**

> Delete these files:
> - Entire `src/pages/admin/` folder
> - `src/pages/PendingVerification.tsx`
> - `src/pages/VerificationRejected.tsx`
> - `src/pages/shared/AuditLogs.tsx`
>
> Then update `src/pages/Dashboards.tsx`:
> - Remove `AdminDashboard` function entirely
> - Remove `OperatorDashboard` function entirely
> - Remove `ReceiverDashboard` function entirely
> - Remove `TableWrapper` component (or move to components/ if used by farmer pages)
> - Remove `SearchInput` import if no longer used
> - Rename `FarmerDashboard` → `Dashboard` (export default)
> - Remove all sections that reference: `notifications`, `totalValue`, `truckPlate`, `truck`, `variantId`, `sugarTypeId`, `variant`, `sugarType`
> - Simplify to show only: summary cards (total deliveries, total kg, earnings, expenses, net profit) + recent deliveries list + "New Quedan" button + QuedanForm
> - Remove unused imports
>
> Return list of deleted files and updated Dashboards.tsx content.

---

## Phase 5: Refactor API Endpoints

**Prompt:**

> Refactor `src/server/api.ts` for farmer-only. Do ALL these changes:
>
> ### 1. Remove these route groups entirely:
> - `/admin/*` (all admin routes)
> - `/variants`, `/sugar-types`, `/pricings`
> - `/expense-categories` (keep only GET)
> - `/users` (GET all users)
> - `/verify-email`, `/send-verification`, verification routes
> - `/notifications` (all)
> - Audit log routes
> - Reconciliation routes
> - `/settings` (all)
>
> ### 2. Remove all `roleGuard` usage
> - Delete `roleGuard` import and function
> - Remove all `roleGuard(...)` calls
> - Remove `role` from JWT payload (keep userId only)
> - Remove `role` from login response
> - Remove `role` from profile response
>
> ### 3. Remove all `req.user!.role === 'FARMER'` checks
> - Everywhere in the file, remove conditions that check role
>
> ### 4. Rename `/trucks` endpoints → `/bagon`
> - POST/GET/PATCH/DELETE `/trucks` → `/bagon`
> - `prisma.truck` → `prisma.bagon`
> - Remove `make`, `model`, `capacity`, `color` from request body
> - Add `type` to request body
>
> ### 5. Update `POST /tickets` (quedan creation):
> - Accept `bagonId` instead of `truckPlate` + `truckId`
> - Remove `pricePerKg`, `totalValue`, `sugarTypeId`, `variantId`
> - Calculate `netWeight = grossWeight - tareWeight`
> - Remove `truckPlate` from ticketNo generation variant
> - Store `bagonId` and `netWeight`
>
> ### 6. Update `GET /tickets` and `GET /tickets/:id`:
> - Include `bagon: true` instead of `truck: true`
> - Remove include of `variant`, `sugarType`, `reconciliation`
> - Remove `totalValue` from any aggregation/summary
>
> ### 7. Update `PATCH /tickets/:id`:
> - Remove `disputeNotes`, `disputePhotoUrl`, `disputeFinal`, `adjustedWeight`, `adjustedPrice`, `verifiedAt`, `verifiedBy`
>
> ### 8. Simplify registration (`POST /register`):
> - Remove role selection, verification fields, `emailVerified`, `verificationStatus`
> - Simplify to: name, email, password, contactNumber, assignedMill
>
> ### 9. Simplify login (`POST /login`):
> - Remove `role` and `verificationStatus` from response
> - Remove verification checks
>
> ### 10. Remove `/forgot-password` and `/reset-password` (optional)
> ### 11. Clean up unused imports
> ### 12. Keep farmer-relevant routes: `/farms`, `/expenses`, `/farm-expenses`, `/payments`, `/delivery-receipts`, `/upload`, `/profile`, `/tickets`
>
> Return summary of all changes made.

---

## Phase 6: Simplify App.tsx + Sidebar + ProtectedRoute

**Prompt:**

> ### 1. Update `src/App.tsx`:
> - Remove `PrivateRoute` component's `allowedRoles` prop — just check if user is authenticated
> - Remove `verificationStatus` checks in PrivateRoute
> - Remove all `/dashboard/admin/*` routes
> - Remove `/pending-verification` and `/verification-rejected` routes
> - Remove `/dashboard/activity-logs` route
> - Remove `/dashboard/settings` route (or keep but simplify)
> - Change all `/dashboard/farmer/*` routes → `/dashboard/*`
> - Update imports: remove all admin page imports, verification page imports, AuditLogs import
> - Remove `Sidebar role={user.role}` → just `<Sidebar />`
> - Remove `roleGuard` if imported
>
> New route structure:
> ```
> / → LandingPage
> /login → Login
> /dashboard → Dashboard
> /dashboard/farms → Farms
> /dashboard/bagon → Bagon
> /dashboard/deliveries → Deliveries
> /dashboard/expenses → Expenses
> /dashboard/payments → Payments
> /dashboard/reports → Reports
> /dashboard/profile → Profile
> ```
>
> ### 2. Update `src/components/Sidebar.tsx`:
> - Remove `role` prop — always farmer
> - Remove the `switch(role)` block — always show farmer nav
> - Remove admin nav items entirely
> - Remove `getRoleIcon()`, `getGradient()`, `getRoleColor()` functions
> - Remove `role.replace('_', ' ')` display
> - Keep nav items: Dashboard, Farms, Bagon, Expenses, Payments, Reports
> - Rename "Trucks" → "Bagon" in nav labels
> - Update icon if desired (keep Truck icon or change)
>
> Return updated App.tsx and Sidebar.tsx content.

---

## Phase 7: Rename Truck → Bagon in Farmer Pages

**Prompt:**

> Update all farmer UI pages. Do ALL these files:
>
> ### 1. `src/pages/farmer/FarmerTrucks.tsx` → rename file to `Bagon.tsx`:
> - Rename export: `FarmerTrucks` → `Bagon`
> - Rename interface `TruckData` → `BagonData`
> - Rename interface `TruckForm` → `BagonForm`
> - Remove: `make`, `model`, `capacity`, `color` from interface and form
> - Add: `type` field to BagonForm (select: 14ft, 18ft, 20ft)
> - API endpoint: `/trucks` → `/bagon`
> - Card display: remove capacity/color, show type ("18ft bagon")
> - Form: remove Make/Model/Capacity/Color inputs, add Type select
> - Summary cards: remove capacity cards, keep total count
> - Remove `Gauge` icon import if unused
> - All text: "Truck" → "Bagon"
>
> ### 2. `src/components/QuedanForm.tsx`:
> - API endpoint: `/trucks` → `/bagon` in useEffect
> - Select label: "Truck Plate" → "Bagon"
> - Select placeholder: "Select a Truck" → "Select a Bagon"
> - Option text: remove make/model/capacity, show `{b.plateNumber} ({b.type})`
> - onChange: set `bagonId` and `bagonPlate` instead of `truckId` and `truckPlate`
> - Form state: rename `truckPlate` → `bagonPlate`, `truckId` → `bagonId`
> - handleSubmit: send `bagonId` instead of `truckPlate` + `truckId`
> - Remove: variantId, sugarTypeId from form state
> - Remove: Variant and Sugar Type select dropdowns
> - Reset form: remove variantId, sugarTypeId
>
> ### 3. `src/components/TicketDetails.tsx`:
> - Rename all "truck" → "bagon" in labels and text
> - Replace `truck` relation → `bagon` in data display
> - Remove: Variant display, Sugar Type display
> - Remove: Dispute section
> - Remove: Reconciliation section
> - Remove: `pricePerKg`, `totalValue`, `adjustedWeight`, `adjustedPrice` display
> - Remove: `verifiedAt`, `verifiedBy` display
> - Remove: `truckPlate` display → show `bagon?.plateNumber`
> - Simplify the expense section if `ExpenseCategory.type` is removed
>
> ### 4. `src/pages/farmer/FarmerFarms.tsx`:
> - Remove `verificationStatus` from Farm interface
> - Remove `c.type === 'FARM'` filter (since `type` field removed from ExpenseCategory)
>
> ### 5. `src/pages/farmer/FarmerReports.tsx`:
> - Change tab label "Trucks" → "Bagon"
> - Replace `t.truck?.plateNumber` → `t.bagon?.plateNumber`
> - Replace `t.truck?.farm?.farmName` → use `t.farm?.farmName`
> - Remove `t.variant?.name` display
> - Remove `t.sugarType?.name` display
>
> ### 6. `src/pages/farmer/FarmerPayments.tsx`:
> - Update the fetchData to use `/tickets` endpoint that now returns tickets with `bagon` instead of `truck`
> - Update any display references if needed
>
> ### 7. `src/pages/farmer/FarmerExpenses.tsx` — (likely fine, verify compile)
>
> Return summary of all changes per file.

---

## Phase 8: Simplify Login, Landing, Profile, Settings

**Prompt:**

> ### 1. `src/pages/Login.tsx`:
> - Remove role selection dropdown
> - Remove verification code flow (handleVerifyCode, handleResendCode, verificationCode state)
> - Remove forgot/reset password flow
> - Simplify to: email + password + login button
> - Remove registration `idImageUrl` upload
> - Remove `verificationStatus` error handling
> - Simplify navigation after login (always go to /dashboard)
>
> ### 2. `src/pages/LandingPage.tsx`:
> - Remove "Admin" and "Operator" role cards — keep only "Farmer"
> - Remove "Reconciliation" text references
> - Focus hero text on sugarcane farmers & bagon tracking
>
> ### 3. `src/pages/shared/Profile.tsx`:
> - Remove `authUser?.role === 'FARMER'` checks
> - Remove `authUser?.role.replace('_', ' ')` display
> - Remove `role` from any API calls
>
> ### 4. `src/pages/shared/Settings.tsx`:
> - Remove admin settings section (base price, variance threshold)
> - Remove `api.get('/settings')` and `api.post('/settings')`
> - Remove `role === 'ADMIN'` checks
> - Keep only farmer-relevant settings if any, or delete the page entirely
> - If keeping, show only: appearance/theme toggle, notification prefs (password change is in Profile.tsx)

> ### 5. `src/pages/Dashboards.tsx` — Verify FarmerDashboard→Dashboard rename (already done in Phase 4):
> - Ensure the import in `src/App.tsx` matches the export name
> - Update any file that imports `FarmerDashboard` → `Dashboard`
>
> Return updated file contents.

---

## Phase 9: Fix netWeight vs millWeight Everywhere

**Prompt:**

> The schema now has both `millWeight` (computed as gross - tare at submission) and `netWeight` in WeightTicket. Standardize to use only `netWeight`:
>
> ### In `src/server/api.ts`:
> - POST /tickets: calculate `netWeight` = grossWeight - tareWeight, store it
> - Either keep `millWeight` as alias for `netWeight`, or remove `millWeight` calc
> - Return `netWeight` in ticket responses
>
> ### In all UI files:
> - Search for `millWeight` references and replace with `netWeight`
> - Search for "Mill Weight" text and replace with "Net Weight"
>
> ### Files to check:
> - `src/pages/farmer/FarmerReports.tsx` (any kg calculations)
> - `src/components/QuedanForm.tsx` (the calculated mill weight display)
> - `src/pages/Dashboards.tsx` (Dashboard summary cards)
> - `src/components/TicketDetails.tsx` (weight display)
>
> Return list of all changes.

---

## Phase 10: Build Test

**Prompt:**

> Test the refactored build:
>
> 1. Run `npx prisma generate`
> 2. Run `npx prisma db push --accept-data-loss`
> 3. Run `npx prisma db seed`
> 4. Run `npx tsc --noEmit` to find all errors
> 5. Fix ALL TypeScript errors one by one:
>    - Any remaining reference to `role`, `verificationStatus`, `isActive`, `rejectionReason`, `emailVerified`, `verifiedAt`, `verifiedBy`
>    - Any remaining reference to `truck` (especially `truckPlate`, `truckId`, `truck` relation)
>    - Any remaining reference to `variant`, `sugarType`, `reconciliation`
>    - Any remaining reference to `totalValue`, `pricePerKg`, `adjustedWeight`, `adjustedPrice`, `disputeNotes`, `disputeFinal`
>    - Any missing `bagon` relation
>    - Any remaining reference to `SystemSettings`, `AuditLog`, `VerificationDocument`
>    - Any remaining import of deleted files (admin pages, verification pages, etc.)
>    - Any missing/extra closing tags or JSX errors
> 6. Run `npm run build` (or `npx vite build`)
> 7. Report ALL errors found and how each was fixed
