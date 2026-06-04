# CaneTrack Revisions

## Roles
- **Farmer** — manage farm, truck, create quedans, track deliveries, add expenses, view payments
- **Admin** — verify farmers/farms, manage variants/pricing, reconcile tickets, process payments, resolve disputes

## Registration & Verification
1. Farmer registers with basic info + upload valid ID (image)
2. Account created as **PENDING** — cannot login until verified
3. Admin approves/rejects ID
4. Admin assigns farmer to a **Mill/Central** (fixed per farmer)
5. After verified → farmer adds farm(s) + upload farm papers (land title, tax declaration)
6. Admin approves farm → only verified farms can create quedans
7. Quedan auto-shows assigned mill (not editable by farmer)

## Truck Management
- Farmer registers trucks (plate #, make, model, capacity)
- Dropdown on quedan creation

## Quedan (Delivery Ticket)
- Auto-generated: QDN-2026-00001
- Fields: Farm, Truck, Driver, Variant, Sugar Type, Gross Weight, Tare Weight, Net Weight (auto), Brix, Pol, Purity (auto), Sample Collected, Delivery Date, Receipt Photo
- Status: PENDING → VERIFIED → RECONCILED → PAID
- Admin verifies quedan after review

## Variants, Types & Pricing
- Variants: Phil 93-93, VMC 86-550, etc.
- Sugar Types: Raw, Brown, Refined, Muscovado, Molasses
- Pricing: Base Price/kg (set by admin), Quality Factor (based on Brix+Pol), Effective Price/kg

## Expenses
- Per delivery: Diesel, Toll, Repair, Labor, Meals, Misc
- Per farm: Fertilizer, Pesticide, Irrigation, Labor, Rental
- Attach receipt photos
- Locked once reconciled/disputed

## Disputes
- Farmer flags quedan with reason
- Admin accepts (adjust weight/price → RECONCILED) or rejects (permanent DISPUTED)
- Expenses frozen on dispute
- No payment for permanently disputed

## Payments
- Method: Bank Transfer, GCash, Cash, Check
- Gross - Deductions = Net
- Status: Pending / Partial / Paid
- Attach proof of payment

## Dashboard & Reports
- Farmer: Total KG, Total Earnings, Total Expenses, Profit/Loss, per Farm/Truck performance
- Admin: Pending verifications, Open disputes, All quedans, Payments
- Simple monthly summaries

## What NOT to include (overcomplicated)
- Operator/Receiver roles
- Mill selection
- Farm blocks/fields
- Harvest scheduling
- GPS tracking
- QR codes
- SMS notifications
- Yield projections
- Advance payments
- Document expiry tracking
