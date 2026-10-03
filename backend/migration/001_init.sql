-- SneakDrop Database Migration
-- Run this file once on a fresh PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- PRODUCTS
-- =========================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    total_stock INTEGER NOT NULL CHECK (total_stock >= 0),
    available_stock INTEGER NOT NULL CHECK (
        available_stock >= 0
        AND available_stock <= total_stock
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- HOLDS
-- =========================================================

CREATE TABLE IF NOT EXISTS holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    product_id UUID NOT NULL
        REFERENCES products(id),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'expired',
                'paid',
                'cancelled'
            )
        ),

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);


-- Only one active hold per user.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_hold_per_user
ON holds(user_id)
WHERE status = 'active';


-- =========================================================
-- ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    product_id UUID NOT NULL
        REFERENCES products(id),

    hold_id UUID NOT NULL UNIQUE
        REFERENCES holds(id),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'paid',
                'expired',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);


-- =========================================================
-- WAITLIST
-- =========================================================

CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    product_id UUID NOT NULL
        REFERENCES products(id),

    position BIGSERIAL,

    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (
            status IN (
                'waiting',
                'promoted',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    promoted_at TIMESTAMPTZ
);


-- Only one active waitlist entry per user/product.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_waitlist_entry
ON waitlist(user_id, product_id)
WHERE status = 'waiting';


-- FIFO lookup.
CREATE INDEX IF NOT EXISTS waitlist_fifo_index
ON waitlist(product_id, status, position);


-- =========================================================
-- PAYMENT EVENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id TEXT UNIQUE NOT NULL,
    payment_id TEXT NOT NULL,
    order_id UUID NOT NULL
        REFERENCES orders(id),

    event_type TEXT NOT NULL,
    payload JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);


-- =========================================================
-- SEED PRODUCT
-- =========================================================

INSERT INTO products (
    id,
    name,
    total_stock,
    available_stock
)
VALUES (
    'fe539a42-ae92-4647-bbc1-691bb1bf53b7',
    'SneakDrop Limited Edition',
    20,
    20
)
ON CONFLICT (id) DO NOTHING;