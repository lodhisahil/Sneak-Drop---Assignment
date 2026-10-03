# SneakDrop

A limited-stock sneaker sale system built to handle concurrent purchases without overselling.

## Features

- Limited stock of 20 pairs
- Safe concurrent purchasing
- 5-minute inventory holds
- Maximum 2 paid purchases per user
- FIFO waitlist
- Automatic waitlist promotion after hold expiry
- Fake payment events with idempotency
- Live hold countdown
- Six demo users for testing

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`

### Database

- Supabase PostgreSQL

## Project Structure

```text
sneakDrop-assignment/
├── backend/
│   ├── migrations/
│   │   └── 001_init.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── workers/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── NOTES.md
├── README.md
└── .gitignore
```

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/lodhisahil/sneakdrop-assignment.git
cd sneakdrop-assignment
```

### 2. Setup the Database

The repository contains the complete database migration:

```text
backend/migrations/001_init.sql
```

If using Supabase:

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Open `backend/migrations/001_init.sql`.
4. Copy the complete SQL file into the SQL Editor.
5. Run it.

The migration automatically creates all required tables, indexes, constraints and the demo product.

Created tables:

```text
users
products
holds
orders
waitlist
payment_events
```

The migration also creates the initial product:

```text
Name: SneakDrop Limited Edition
Total Stock: 20
Available Stock: 20
```

No manual table creation is required.

### 3. Configure the Backend

```bash
cd backend
npm install
```

Create a file:

```text
backend/.env
```

Add:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
```

For Supabase, use the PostgreSQL connection string provided by your Supabase project.

> Do not commit `.env` or expose your database credentials.

### 4. Start the Backend

```bash
npm run dev
```

The backend should run on:

```text
http://localhost:5000
```

You can verify the server using:

```text
GET /health
```

Expected response:

```json
{
    "success": true,
    "message": "SneakDrop API is running"
}
```

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

The frontend communicates with the backend at:

```text
http://localhost:5000
```

## Main API Endpoints

### Buy Sneaker

```http
POST /api/sale/buy
```

### Sale Status

```http
GET /api/sale/status
```

### Payment Event

```http
POST /api/payment/event
```

### Health Check

```http
GET /health
```

## Demo

The frontend provides six demo users:

```text
User 1
User 2
User 3
User 4
User 5
User 6
```

Use the user switcher to demonstrate different states.

Example:

```text
User 1 → Buy → 5-minute hold
User 2 → Buy → another hold
User 3 → Waitlist
User 1 → Pay Now
```

The UI displays:

- Available pairs
- Active hold
- Hold countdown
- Payment state
- Waitlist position
- Paid order count

## Concurrency

Inventory