# Bagon & Truck — Implementation Prompts

## Phase 1: Database & Schema
Add new Prisma models and fields:
- New model `Truck`:
  - `id` String @id @default(cuid())
  - `plateNumber` String @unique
  - `driverName` String
  - `driverContact` String?
  - `compatibleTypes` String (comma-separated, e.g. "14ft,18ft,20ft")
  - `ownerId` String (relation to User)
  - `isArchived` Boolean @default(false)
  - `createdAt`, `updatedAt`
- New model `Bagon` — rename display label to "Trailer" internally, or keep as-is
- `WeightTicket` — add optional `truckId` String? relation to Truck
- `npx prisma db push --accept-data-loss` + `npx prisma generate`

## Phase 2: Server API — Truck CRUD
Add routes in `src/server/api.ts`:
- `GET /trucks` — list user's trucks
- `POST /trucks` — create truck (plateNumber, driverName, driverContact, compatibleTypes)
- `PATCH /trucks/:id` — update truck
- `DELETE /trucks/:id` — archive truck
- `GET /tickets` — include `truck` relation in response

## Phase 3: Trucks Page
Create `src/pages/farmer/Trucks.tsx`:
- Table listing all registered trucks (plate, driver, contact, compatible types)
- "Add Truck" button → modal/form with fields:
  - Plate Number (text, required)
  - Driver's Name (text, required)
  - Driver's Contact Number (tel, optional)
  - Compatible Bagon Types (multi-select checkboxes: 14ft, 18ft, 20ft, or text input)
- Edit (pencil) and Archive (trash) actions per row
- Same styling as Bagon/Farms pages (StatCard header, TableWrapper)

## Phase 4: Sidebar — Rename Bagon to Trailers, Add Trucks
In `src/components/Sidebar.tsx`:
- Rename "Bagon" link to "Trailers"
- Add new "Trucks" link with `Truck` icon (from lucide-react)
- Both under verified gate

## Phase 5: QuedanForm — Truck Select + Compatibility Check
In `src/components/QuedanForm.tsx`:
- Truck select dropdown (after Farm select, before Bagon select)
  - Shows: "Plate No. — Driver Name"
  - Fetched from `GET /trucks`
- Bagon (Trailer) select remains, but:
  - When a Truck is selected, filter bagons to only show those with types in truck's `compatibleTypes`
  - If no compatible bagon found, show warning: "No compatible trailer for this truck"
  - If user selects a bagon type incompatible with truck, show red warning: "Incompatible: this trailer type is not supported by the selected truck"
- Auto-fill `truckNumber` and `authorizedSignatory` from selected Truck:
  - `truckNumber` = truck's plateNumber (hidden, sent in POST)
  - `authorizedSignatory` = truck's driverName (editable/overridable)
- Include `truckId` in POST body

## Phase 6: TicketDetails — Display Truck Info
In `src/components/TicketDetails.tsx`:
- After the bagon section, add a "Truck & Driver" section:
  - Plate Number (from truck relation or truckNumber field)
  - Driver Name
  - Driver Contact (if available)
- Replace the free-text `truckNumber` display with linked truck data

## Phase 7: Routes & App
In `src/App.tsx`:
- Add route `/dashboard/trucks` → `Trucks` component (under PrivateRoute + VerifiedRoute)
- Import Trucks page

---

> **Usage:** Feed me one phase at a time. I'll implement, commit, push, then wait for the next prompt.
