# Admin realtime orders + out-of-stock switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realtime admin order updates to `OrderManagementPage` and auto-suggest/auto-navigate to an in-stock replacement product on `ProductDetail` when the current product is out of stock.

**Architecture:** Use Socket.io on the existing backend `io` server to broadcast admin-only order events to an `admins` room. On the frontend, keep existing REST fetch as baseline, then patch local state on socket events. Implement out-of-stock UX purely in `ProductDetail.tsx` using existing related-product fetching.

**Tech Stack:** Node/Express + Socket.io, React + Vite + socket.io-client, Axios.

---

## File structure (created/modified)

- Create: `MINI64-api/src/sockets/adminOrdersSocket.js`
- Modify: `MINI64-api/server.js`
- Modify: `MINI64-api/src/controllers/OrderController.js`
- (Optional) Modify: `MINI64-api/src/services/OrderService.js` (only if needed to return created order data consistently)
- Modify: `MINI64-web/src/pages/OrderManagementPage/OrderManagement.tsx`
- Modify: `MINI64-web/src/pages/ProductDetail.tsx`

---

### Task 1: Backend — admin order socket (auth + room)

**Files:**
- Create: `MINI64-api/src/sockets/adminOrdersSocket.js`
- Modify: `MINI64-api/server.js`

- [ ] **Step 1: Create `adminOrdersSocket.js` with JWT handshake auth**
  - Implement helper to extract token from `socket.handshake.auth.token` or `socket.handshake.headers.authorization`
  - Verify JWT with `process.env.ACCESS_TOKEN` (same as `liveCommerceSocket.js`)
  - If role is `admin`, join room `admins`
  - Export:
    - `initAdminOrdersSocket(io)`
    - `emitAdminOrderCreated(orderLike)`
    - `emitAdminOrderUpdated(orderLike)`
  - Keep payload minimal: `_id, createdAt, totalPrice, status, trackingCode, carrierName, shippingAddress.fullName`

- [ ] **Step 2: Wire socket init in `server.js`**
  - Import and call `initAdminOrdersSocket(io)` after `io` is created.

- [ ] **Step 3: Quick manual verification**
  - Run API server and confirm socket connects for admin token (no runtime crash).

- [ ] **Step 4: Commit**
  - (Skip unless requested)

---

### Task 2: Backend — emit events on order create/update

**Files:**
- Modify: `MINI64-api/src/controllers/OrderController.js`

- [ ] **Step 1: Emit on create**
  - After `OrderService.createOrder` returns OK, call `emitAdminOrderCreated(response.data)`

- [ ] **Step 2: Emit on update**
  - In `updateOrderStatus` and bulk update, also call `emitAdminOrderUpdated(order)`
  - Keep existing `emitOrderStatusUpdated` behavior unchanged (viewer tracking)

- [ ] **Step 3: Manual verification**
  - Create order from storefront, see server emits without errors.

- [ ] **Step 4: Commit**
  - (Skip unless requested)

---

### Task 3: Frontend — realtime patching on `OrderManagementPage`

**Files:**
- Modify: `MINI64-web/src/pages/OrderManagementPage/OrderManagement.tsx`

- [ ] **Step 1: Add socket.io-client connection**
  - Connect to `VITE_API_URL` using `access_token` (Bearer)
  - Listen for:
    - `ADMIN_ORDER_CREATED` → prepend to `orders` if not present
    - `ADMIN_ORDER_UPDATED` → update matching row if present
  - Cleanup on unmount

- [ ] **Step 2: Update local derived states**
  - On created event: also initialize `draftStatus` and `shippingDraft` entries for that order
  - Avoid disturbing current filter UI; rely on existing `displayedOrders` memo for filtering

- [ ] **Step 3: Manual verification**
  - Open two admin tabs; place an order; both tabs update total + row list.
  - Update status in one tab; other tab updates row.

- [ ] **Step 4: Commit**
  - (Skip unless requested)

---

### Task 4: Frontend — out-of-stock banner + auto-switch on `ProductDetail`

**Files:**
- Modify: `MINI64-web/src/pages/ProductDetail.tsx`

- [ ] **Step 1: Disable add-to-cart when out of stock**
  - Add `disabled` state to the button and prevent `addToCart` call if `!inStock`

- [ ] **Step 2: Choose replacement product**
  - From `relatedProducts`, pick first with `stock > 0` and same category name (or match by category id when available)
  - Fallback to any `stock > 0`

- [ ] **Step 3: Auto-navigation UX**
  - Render banner when `!inStock && replacement exists`
  - Start 3s countdown timer to navigate to `/products/<replacementId>`
  - Buttons:
    - Cancel → clear timer, stop auto navigation
    - View now → navigate immediately
  - Ensure timers clear on unmount and on `id` change

- [ ] **Step 4: Manual verification**
  - Visit an out-of-stock product; confirm banner + countdown; cancel works; view now works.

- [ ] **Step 5: Commit**
  - (Skip unless requested)

---

### Task 5: Lint / smoke checks

**Files:**
- Modified/created above

- [ ] **Step 1: Run lint/typecheck (if available)**
  - `MINI64-web`: `npm run lint` / `npm run build` (depending on repo scripts)
  - `MINI64-api`: run server start to confirm no syntax errors

- [ ] **Step 2: Fix any introduced lints**

