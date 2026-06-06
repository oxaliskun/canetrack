# Sugarcane Delivery Ticket — Enhancement Prompts

## Phase 1: Database & Schema
Add new fields to Prisma schema:
- `User`: `paNumber` (String?), `millName` (String?)
- `WeightTicket`: `truckNumber` (String?), `caneVariety` (String?), `loadRemarks` (String?), `unloadingType` (String?), `deliveryDate` (DateTime?), `authorizedSignatory` (String?)

Run `npx prisma db push --accept-data-loss` and `npx prisma generate`.

## Phase 2: Server API — Ticket Routes
Update `POST /tickets` and `PATCH /tickets/:id` in `src/server/api.ts` to accept and store: `truckNumber`, `caneVariety`, `loadRemarks`, `unloadingType`, `deliveryDate`, `authorizedSignatory`.

Update `GET /tickets` includes to return `farmer.millName` and `farmer.paNumber`.

## Phase 3: Server API — Profile Routes
Update `GET /users/profile` and `PATCH /users/profile` in `src/server/api.ts` to include `paNumber` and `millName` from User model.

## Phase 4: QuedanForm — Delivery & Cane Details
In `src/components/QuedanForm.tsx`, add:
- **Delivery Details** section (after Bagon select, before tare/gross): `truckNumber` (text), `deliveryDate` (date, default today), `authorizedSignatory` (text)
- **Cane Details** section (after net weight display): `caneVariety` (dropdown — same 10 Mindanao varieties), `loadRemarks` (dropdown: FC, BS, BF, G, LO, Others with labels), `unloadingType` (radio: Gantry / Direct Dump)
- Include all fields in `createTicket` POST body. All optional except deliveryDate.

## Phase 5: TicketDetails — Display New Fields
In `src/components/TicketDetails.tsx`, after bagon info section, add display rows for: `truckNumber`, `deliveryDate` (formatted), `authorizedSignatory`, `caneVariety`, `loadRemarks` (show label), `unloadingType`.

In the Farmer/Mill section, replace `assignedMill` with both `millName` and `paNumber`.

## Phase 6: Profile Page — P.A. No. & Mill Name
In `src/pages/shared/Profile.tsx`, add form fields for:
- **P.A. No.** (text input below Contact Number)
- **Mill Name** (text input below P.A. No.)
Include both in the PATCH `/users/profile` payload and display them in the Profile Summary sidebar.

## Phase 7: Dashboard & Reports — Update Labels/Groupings
Update reports to group by `caneVariety` if available. Update Dashboard monthly stats to include variety breakdown (optional enhancement).

---

> **Usage:** Feed me one phase at a time. I'll implement, commit, push, then wait for the next prompt.
