# PlaybookPro – Football Playbook Builder

A full-stack web application for building and organizing an American Football playbook. Coaches can create formations, add plays under each formation, and write detailed position-by-position assignments (routes, blocks, reads) for every play.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, vanilla JavaScript (served as static files from `/public`)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher) running locally

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Open a terminal and run:

```bash
psql -U postgres
```

Inside psql, create the database:

```sql
CREATE DATABASE playbook_builder;
\q
```

### 3. Load the schema and sample data

```bash
psql -U postgres -d playbook_builder -f database.sql
```

This creates the `formations`, `plays`, and `assignments` tables and inserts sample data.

### 4. Configure the environment

Create a `.env` file in the root of the project:

```
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/playbook_builder
PORT=4000
```

Replace `postgres` with your PostgreSQL username and `yourpassword` with your actual password.

### 5. Start the server

```bash
npm start
```

Or, for auto-restart on file changes during development:

```bash
npm run dev
```

### 6. Open the app

Visit [http://localhost:4000](http://localhost:4000) in your browser.

---

## Database Schema

**formations**
| Column | Type | Notes |
|---|---|---|
| formation_id | SERIAL | Primary key |
| name | VARCHAR(100) | Required |
| personnel | VARCHAR(50) | e.g. "11", "12", "21" |
| description | TEXT | |
| created_at | TIMESTAMP | Defaults to now |

**plays**
| Column | Type | Notes |
|---|---|---|
| play_id | SERIAL | Primary key |
| formation_id | INTEGER | FK → formations.formation_id |
| name | VARCHAR(100) | Required |
| play_type | VARCHAR(20) | "run", "pass", or "rpo" |
| notes | TEXT | |
| created_at | TIMESTAMP | Defaults to now |

**assignments**
| Column | Type | Notes |
|---|---|---|
| assignment_id | SERIAL | Primary key |
| play_id | INTEGER | FK → plays.play_id |
| position | VARCHAR(20) | e.g. "WR1", "LT", "QB" |
| assignment_text | TEXT | Required |
| created_at | TIMESTAMP | Defaults to now |

**Relationships:**
- `plays.formation_id` → `formations.formation_id` (CASCADE DELETE)
- `assignments.play_id` → `plays.play_id` (CASCADE DELETE)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/formations` | Get all formations |
| POST | `/api/formations` | Create a formation |
| PUT | `/api/formations/:id` | Update a formation |
| DELETE | `/api/formations/:id` | Delete a formation (cascades to plays and assignments) |
| GET | `/api/plays` | Get plays (supports `?formation_id=`, `?play_type=`, `?search=`) |
| POST | `/api/plays` | Create a play |
| PUT | `/api/plays/:id` | Update a play |
| DELETE | `/api/plays/:id` | Delete a play (cascades to assignments) |
| GET | `/api/assignments` | Get assignments for a play (`?play_id=` required) |
| POST | `/api/assignments` | Create an assignment |
| PUT | `/api/assignments/:id` | Update an assignment |
| DELETE | `/api/assignments/:id` | Delete an assignment |
