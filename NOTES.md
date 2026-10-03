# SneakDrop — Technical Notes

## Architecture

The application uses a simple Controller + Model architecture.

```text
Request
  ↓
Route
  ↓
Controller
  ↓
Model
  ↓
PostgreSQL
```

Controllers handle business flow while models contain database queries.

An expiry worker periodically handles expired holds and waitlist promotion.

---

## Inventory Concurrency

The product row is locked inside a PostgreSQL transaction:

```sql
SELECT *
FROM products
WHERE id = $1
FOR UPDATE
```

The flow is:

```text
Lock Product
    ↓
Check Stock
    ↓
Create Hold
    ↓
Decrease Stock
    ↓
Create Order
    ↓
Commit
```

This prevents multiple concurrent requests from reserving the same inventory.

A concurrency test with 100 simultaneous requests against 20 pairs resulted in:

```text
20 active holds
80 waitlist entries
0 server errors
0 overselling
```

---

## Holds

Every successful purchase creates a 5-minute hold.

Hold states:

```text
active
expired
paid
cancelled
```

The frontend displays the remaining hold time using `expires_at`.

The backend remains the source of truth for hold validity.

---

## Purchase Limits

A user can have only one active hold.

A user can complete a maximum of two paid orders.

These rules are enforced by the backend, with a database constraint protecting the active-hold rule.

---

## Waitlist

When stock reaches zero, users are added to a FIFO waitlist.

When a hold expires, the expiry worker:

1. Expires the hold.
2. Expires its pending order.
3. Finds the first eligible waiting user.
4. Creates a new 5-minute hold and pending order for that user.

The frontend displays the user's current position in the waiting queue.

---

## Payments

Payments are simulated using:

```http
POST /api/payment/event
```

A successful payment changes:

```text
Order → paid
Hold  → paid
```

Payment events use a unique `event_id` to prevent duplicate processing.

---

## Database Tables

The project uses:

```text
users
products
holds
orders
waitlist
payment_events
```

Supabase is used as the PostgreSQL database host. Database operations are performed directly through the Node.js `pg` client.

---

## Frontend Demo

The frontend provides six demo users that can be switched from the UI.

This allows the complete sale flow to be demonstrated without implementing authentication.

Example:

```text
User 1 → Hold
User 2 → Hold
User 3 → Waitlist
User 1 → Payment
```

---

## Important Assumptions

- Payment is simulated; no real payment gateway is integrated.
- Demo users are for testing only.
- The backend/database is the source of truth for inventory and purchase rules.
- The frontend is intentionally kept simple to focus on the core assignment requirements.