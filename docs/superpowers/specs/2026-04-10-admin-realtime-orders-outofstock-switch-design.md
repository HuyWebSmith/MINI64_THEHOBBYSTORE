# Admin realtime orders + out-of-stock product switch (Design)

**Date:** 2026-04-10  
**Scope:** Whole-shop admin order management + product detail out-of-stock switching (non-livestream).

## Goal

- **Admin** can see **new orders in realtime** on `OrderManagementPage` (no manual refresh needed).
- **Product detail** automatically **suggests and can auto-navigate** to an in-stock replacement when the current product is out of stock.

## Non-goals

- Rebuilding the existing live commerce (`LiveStream*`) flow.
- Adding a full “product versioning” system or “replacementProductId” management UI in admin (can be a future enhancement).
- Guaranteeing strict global ordering across concurrent order events (we only need “realtime enough” UI consistency).

## Current state (as-is)

- Admin order list page: `MINI64-web/src/pages/OrderManagementPage/OrderManagement.tsx`
  - Fetches orders via `GET /api/orders` with admin token.
  - Has local state for `orders`, status drafts, bulk updates.
  - No realtime updates.
- Orders API (admin):
  - Router: `MINI64-api/src/routes/OrderRouter.js` (`GET /` guarded by `authMiddleware + adminAuthMiddleware`).
  - Controller: `MINI64-api/src/controllers/OrderController.js`
  - Service: `MINI64-api/src/services/OrderService.js`
- Socket.io already exists in backend:
  - `MINI64-api/server.js` creates `io` and initializes:
    - `initLiveCommerceSocket(io)`
    - `initOrderStatusSocket(io)` (viewer tracking only, not admin order list)

## Requirements

### R1: Realtime “new orders” for admin order list

- When a new order is created, **all connected admins** viewing `OrderManagementPage` see it appear without reloading.
- When an order is updated (status / shipping info), **admins** see the row update.
- Updates must be **authorized**: only admins receive the stream.

### R2: Auto-switch (replacement) when product is out of stock

- When viewing `ProductDetail` and `stock <= 0`:
  - Disable “Add to cart” action (it should not proceed).
  - Show an “Out of stock” banner with:
    - Suggested replacement product (if available).
    - Optional auto-navigation after a short countdown (default 3 seconds).
    - Controls: **Cancel** auto-navigation and **View now**.
- Replacement selection rule (MVP):
  - Prefer **same category**, **in stock**.
  - Exclude current product.
  - Fallback: any in-stock product from the same `get-all` result set.

## Proposed approach (recommended)

### A) Admin order stream via Socket.io (event-driven)

Add a dedicated socket namespace/module (same server instance) for admin-order events.

#### Backend design

- New socket module: `MINI64-api/src/sockets/adminOrdersSocket.js`
  - Authenticate from Socket.io handshake token:
    - Use the same JWT verification strategy as `liveCommerceSocket.js` (reads `Bearer <token>` from handshake).
  - On connect:
    - If user role is `admin`, join a room: `admins`
    - Else, emit error and disconnect (or just don’t join room).
- New events (server → client)
  - `ADMIN_ORDER_CREATED`
  - `ADMIN_ORDER_UPDATED`
- Emit points
  - In `OrderController.createOrder`: if creation OK, emit `ADMIN_ORDER_CREATED` with a minimal `OrderRow` payload.
  - In `OrderController.updateOrderStatus` and `updateManyOrderStatuses`: on OK, emit `ADMIN_ORDER_UPDATED` with the updated order payload(s).

#### Payload shape (MVP)

Send the fields that `OrderManagement.tsx` already needs:

- `_id`
- `createdAt`
- `totalPrice`
- `status`
- `trackingCode?`
- `carrierName?`
- `shippingAddress.fullName?`

Notes:
- Keep payloads small; the admin list does not need full order items.
- If a future change needs more detail, the page can fetch details by ID on demand.

#### Frontend design

- `OrderManagement.tsx`:
  - Create a socket connection to `VITE_API_URL` when an access token exists.
  - Subscribe to:
    - `ADMIN_ORDER_CREATED`: prepend to `orders`, initialize `draftStatus` and `shippingDraft` for the new order, update selection filtering safely.
    - `ADMIN_ORDER_UPDATED`: update the matching row in `orders` if present; if not present (filtered out), no-op.
  - Cleanup: disconnect socket on unmount.

### B) Product out-of-stock replacement + auto-navigation (countdown)

Implement purely in `ProductDetail.tsx` (MVP) using the already-fetched “related products” source:

- Compute `inStock` for the current product.
- If `!inStock`:
  - Determine `replacementProductId` from `relatedProducts`:
    - Prefer same category and `stock > 0`.
    - Else any `stock > 0`.
  - Render an “Out of stock” banner with CTA.
  - Start a `setTimeout` for 3 seconds to navigate to `/products/<replacementId>`.
  - Provide:
    - “Cancel” button to stop timeout
    - “View now” button to navigate immediately
  - Ensure effect is cancelled on route change/unmount.

## Error handling & edge cases

- **Socket auth missing/expired**: client should fail silently (no realtime), page still works with manual refresh.
- **Admin stream duplicates**: if an order already exists in state, ignore `ADMIN_ORDER_CREATED`.
- **Replacement not found**: show “Out of stock” without auto-navigation.
- **Replacement also becomes out of stock**: the logic runs again after navigation; it will pick another replacement or stop if none.

## Security

- Admin order stream is restricted to users with `role === "admin"` based on verified JWT.
- No sensitive order contents beyond what admin list already displays.

## Test plan (manual)

- Admin realtime orders:
  - Open two admin sessions on `OrderManagementPage`.
  - Create a new order from storefront checkout.
  - Verify both admin sessions show the new order without refresh.
  - Update order status in one admin session.
  - Verify the other session updates the row in realtime.
- Out-of-stock auto-switch:
  - Navigate to a product with `stock = 0`.
  - Verify “Add to cart” is disabled and banner appears.
  - Verify “Cancel” stops auto-navigation.
  - Verify “View now” navigates to suggested product.

