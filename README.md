## PlaybookPro – Football Playbook Builder

PlaybookPro is a full‑stack web application for creating and organizing an American Football playbook. Coaches can define formations, add plays under each formation, and create detailed position‑by‑position assignments (routes, blocks, reads) for every play.

### Tech Stack
- Backend: Node.js, Express, PostgreSQL
- Frontend: HTML, CSS, vanilla JavaScript (served from the `public` folder)

### Database Schema
- **Table: formations**
  - `formation_id` (SERIAL, PK)
  - `name` (VARCHAR)
  - `personnel` (VARCHAR)
  - `description` (TEXT)
  - `created_at` (TIMESTAMP)

- **Table: plays**
  - `play_id` (SERIAL, PK)
  - `formation_id` (INTEGER, FK → formations.formation_id)
  - `name` (VARCHAR)
  - `play_type` (VARCHAR: run / pass / rpo)
  - `notes` (TEXT)
  - `created_at` (TIMESTAMP)

- **Table: assignments**
  - `assignment_id` (SERIAL, PK)
  - `play_id` (INTEGER, FK → plays.play_id)
  - `position` (VARCHAR)
  - `assignment_text` (TEXT)
  - `created_at` (TIMESTAMP)


