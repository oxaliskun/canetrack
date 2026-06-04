# CaneTrack Prompts by Phase

## Phase 1: Schema & Roles

- [x] 1.1 Remove OPERATOR and RECEIVER roles, keep only FARMER and ADMIN
  - schema.prisma: remove operatorId from WeightTicket, receiverId from ReconciliationRecord
  - Remove all roleGuard(['OPERATOR']) and roleGuard(['RECEIVER']) from api.ts
  - Farmer creates tickets now, admin reconciles
  - Remove operator/receiver dashboards (routes + pages)

- [x] 1.2 Add verificationStatus to User model
  - Fields: verificationStatus String @default("PENDING") (PENDING/VERIFIED/REJECTED), rejectionReason String?, verifiedAt DateTime?, verifiedBy String?, assignedMill String? (fixed mill/central assigned by admin)
  - New users = PENDING — cannot access dashboard until VERIFIED
  - Login returns error if PENDING or REJECTED
  - Create PendingVerification.tsx page for redirect

- [x] 1.3 Add VerificationDocument model
  - id, userId, documentType (ID/LAND_TITLE/TAX_DECLARATION/LEASE/CERTIFICATE), imageUrl, status (PENDING/APPROVED/REJECTED), rejectionReason?, createdAt
  - Linked to User

- [x] 1.4 Add Truck model
  - id, plateNumber (unique), make, model, capacity (Float), color?, ownerId (userId, farmer), isArchived Boolean @default(false)
  - Linked to User

- [x] 1.5 Add SugarcaneVariant model
  - id, name (unique), characteristics?, isActive Boolean @default(true)

- [x] 1.6 Add SugarType model
  - id, name (unique), description?, isActive Boolean @default(true)

- [x] 1.7 Add Pricing model
  - id, variantId, sugarTypeId, pricePerKg Float, effectiveDate DateTime, isActive Boolean @default(true)
  - One price per variant+type combo

- [x] 1.8 Add ExpenseCategory model
  - id, name (unique), type (DELIVERY/FARM), description?, isActive Boolean @default(true)

- [x] 1.9 Add Expense model (per delivery)
  - id, quedanId, categoryId, amount Float, receiptUrl?, notes?, createdAt

- [x] 1.10 Add FarmExpense model (per farm, seasonal)
  - id, farmId, categoryId, amount Float, receiptUrl?, notes?, date DateTime, createdAt

- [x] 1.11 Add Payment model
  - id, quedanId (unique), method (BANK_TRANSFER/GCASH/CASH/CHECK), referenceNumber?, grossAmount Float, deductions Float @default(0), netAmount Float, status (PENDING/PARTIAL/PAID), datePaid DateTime?, proofUrl?, notes?, createdAt

- [x] 1.12 Expand WeightTicket to Quedan
  - Add: brix Float?, pol Float?, purity Float? (auto), sampleCollected Boolean, sugarTypeId?, variantId?, truckId?, disputeNotes?, disputeFinal Boolean @default(false), adjustedWeight Float?, adjustedPrice Float?, verifiedAt DateTime?, verifiedBy String?
  - Quedan number format: QDN-2026-00001
  - Status: PENDING/VERIFIED/RECONCILED/DISPUTED/PAID

- [x] 1.13 Add DeliveryReceipt model
  - id, quedanId, imageUrl, createdAt

## Phase 2: Registration & Verification

- [x] 2.1 Add ID upload on registration
  - Login.tsx: file input for valid ID after contact number
  - Upload via /api/upload, send URL to /auth/register
  - User created with verificationStatus=PENDING
  - Creates VerificationDocument with status=PENDING
  - After submit → redirect to PendingVerification page

- [x] 2.2 Add farm document upload
  - Farm creation form: file upload for land title/tax declaration
  - Multiple files allowed
  - Creates VerificationDocuments linked to farm
  - Farm created with verificationStatus=PENDING

- [x] 2.3 Block access until verified
  - After login, check verificationStatus
  - PENDING → /pending-verification (status page)
  - REJECTED → /verification-rejected (show reason + resubmit button)
  - VERIFIED → normal dashboard

- [x] 2.4 Admin verification page
  - Route: /dashboard/admin/verifications
  - List of pending farmers: name, email, registered date, docs count
  - Click → modal: show farmer info + document images (full view)
  - Approve button → modal: "Assign Mill" input (text, e.g., "Victorias Milling Company") → sets VERIFIED + assignedMill
  - Reject button → textarea for reason → sets REJECTED
  - Notify farmer of status change

- [x] 2.5 Resubmit if rejected
  - /verification-rejected page: show reason, upload new button
  - Replaces old docs, resets status to PENDING

## Phase 3: Truck Management

- [x] 3.1 Farmer truck page
  - Route: /dashboard/farmer/trucks
  - Table: plate #, make/model, capacity, color, status
  - Add/edit/archive trucks
  - Validation: plate format, capacity > 0

- [x] 3.2 Admin truck page
  - Route: /dashboard/admin/trucks
  - Same table + farmer dropdown filter
  - Admin can add truck for any farmer

- [x] 3.3 Truck dropdown on quedan creation
  - Plate dropdown instead of text input
  - Filtered by farmer's active trucks

## Phase 4: Quedan (Delivery Ticket)

- [x] 4.1 Rename WeightTicket to Quedan in all UI text
  - "Weight Ticket" → "Quedan" / "Delivery Ticket"
  - "Ticket No" → "Quedan No" (QDN-2026-00001)
  - All frontend labels updated

- [x] 4.2 Add quality fields to quedan form
  - Brix (0-100), Pol (0-100), Purity auto-computed (Pol/Brix*100) read-only
  - Sample Collected checkbox

- [x] 4.3 Add variant + sugar type dropdowns
  - Variant dropdown (active variants only, required)
  - Sugar type dropdown (active types only, required)

- [x] 4.4 Add truck dropdown
  - Truck dropdown (farmer's active trucks only, required)
  - Shows: "ABC-1234 - Isuzu Elf (5 tons)"

- [x] 4.5 Auto-computed net weight
  - Gross - Tare = Net (read-only, updates in real-time)

- [ ] 4.6 Delivery receipt photo upload
  - Up to 3 photos, preview before upload
  - Uploaded on form submit

- [ ] 4.7 Show assigned mill on quedan
  - Read-only field: "Mill/Central" showing farmer's assigned mill
  - Farmer cannot edit
  - Displayed on quedan form, detail, and list

- [ ] 4.8 Admin verifies quedan
  - Admin reviews → VERIFIED or DISPUTED
  - Audit log entry

## Phase 5: Expenses

- [ ] 5.1 Per-delivery expense form
  - Component on quedan detail page
  - Add expense: category dropdown (DELIVERY type), amount, notes, receipt photo
  - List of expenses with total

- [ ] 5.2 Farm seasonal expense form
  - Button on farm detail: "Add Farm Expense"
  - Category dropdown (FARM type), amount, notes, date, receipt

- [ ] 5.3 Admin expense categories
  - Admin CRUD page for categories
  - Seed: Diesel, Toll Fee, Truck Repair, Loading Labor, Unloading Labor, Meals, Fertilizer, Pesticide, Irrigation, Farm Labor, Land Rental, Equipment Rental, Miscellaneous

- [ ] 5.4 Receipt photo attachment
  - Upload per expense, max 5MB, image only
  - Preview/click to enlarge

- [ ] 5.5 Show totals
  - Per quedan: total expenses displayed
  - Per farm: seasonal total
  - Profit/Loss = Payment - Expenses

- [ ] 5.6 Lock on reconcile/dispute
  - When quedan status = RECONCILED or DISPUTED
  - All expense buttons disabled, read-only view
  - Server-side check returns 403

## Phase 6: Variants, Types & Pricing

- [ ] 6.1 Admin variant management
  - CRUD: name, characteristics, active status
  - Seed: Phil 93-93, Phil 99-1793, VMC 86-550, VMC 92-129, Phil 2000-2567

- [ ] 6.2 Admin sugar type management
  - CRUD: name, description, active status
  - Seed: Raw Sugar, Brown Sugar, Refined Sugar, Muscovado, Molasses

- [ ] 6.3 Admin pricing
  - Grid: rows=variants, cols=types, cell=price per kg
  - Click cell to edit price

- [ ] 6.4 Quality factor on quedan
  - Factor = (Brix + Pol) / 200 (0.0-1.0)
  - Display on quedan: base price, factor, effective price

## Phase 7: Disputes

- [ ] 7.1 Farmer dispute button
  - On quedan detail: "Flag Dispute" button (red)
  - Modal: reason textarea (required, min 10 chars), optional photo
  - Status → DISPUTED, notification to admin

- [ ] 7.2 Expenses frozen on dispute
  - All expense edits disabled
  - "Locked" label on expenses section

- [ ] 7.3 Admin dispute review
  - Route: /dashboard/admin/disputes
  - Table of disputed quedans: #, farmer, farm, date, reason
  - Click → full quedan detail with dispute highlighted

- [ ] 7.4 Admin accept
  - "Accept & Adjust" → modal: adjust weight, adjust price, notes
  - Status → RECONCILED, farmer notified

- [ ] 7.5 Admin reject
  - "Reject Dispute" → modal: reason textarea
  - Status → DISPUTED (permanent), disputeFinal = true
  - No payment for permanent disputes

## Phase 8: Payments

- [ ] 8.1 Admin payment form
  - Button on reconciled quedans: "Process Payment"
  - Form: method, reference, gross (auto-filled), deductions, net (auto), notes, proof
  - Creates Payment record

- [ ] 8.2 Payment proof upload
  - Upload screenshot/OR image

- [ ] 8.3 Farmer payment history
  - Route: /dashboard/farmer/payments
  - Table: quedan #, date, method, gross, deductions, net, status
  - Total earnings summary

- [ ] 8.4 Payment on quedan detail
  - Show payment info card: method, ref, amounts, date
  - Profit/Loss = Net Payment - Total Expenses

## Phase 9: Dashboard & Reports

- [ ] 9.1 Farmer summary cards
  - Total KG (month), Total Earnings (month), Total Expenses, Net Profit

- [ ] 9.2 Farmer reports
  - Deliveries: date, quedan #, farm, variant, sugar type, net kg, status
  - Earnings: month, total kg, avg price, gross, deductions, net
  - Expenses: by category (pie chart), by month
  - Profit/Loss: earnings vs expenses line chart
  - Farms: per farm totals
  - Trucks: per truck trips and kg

- [ ] 9.3 Admin dashboard
  - Cards: pending verifications, total farmers, total quedans (month), open disputes
  - Recent pending verifications list
  - Open disputes list

## Phase 10: Cleanup

- [ ] 10.1 Delete old operator/receiver pages
- [ ] 10.2 Update navbar/farmer nav: Dashboard, Farms, Trucks, Create Quedan, Deliveries, Expenses, Payments, Reports
- [ ] 10.3 Update admin nav: Dashboard, Verifications, Farmers, Farms, Trucks, Quedans, Disputes, Payments, Variants, Types, Pricing, Categories, Reports
- [ ] 10.4 Update landing page text to farmer-focused
- [ ] 10.5 Test full flow: register → verify → farm → verify → truck → quedan → expense → reconcile → payment
