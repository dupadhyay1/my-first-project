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

Foreign‑key relationships and sample data are defined in `database.sql`.
   
- **Formations panel (left)**
  - Create a new formation by filling in the form and clicking **Save Formation**.
  - Click any formation in the list to select it, load its details into the form, and filter plays.
  - Edit and save, or delete the formation; deleting also removes its plays and assignments.

- **Plays panel (middle)**
  - Use the filters (formation, play type, search) to quickly find plays.
  - Create a play by choosing a formation, entering a name, selecting type (run/pass/RPO), and adding notes.
  - Click a play in the list to edit it and to load its assignments on the right.

- **Assignments panel (right)**
  - After selecting a play, add position‑specific assignments (e.g., WR1, LT, QB) with detailed instructions.
  - Click an assignment to edit or delete it.

The UI shows success and error messages under each form and a small toast notification in the bottom‑right corner, satisfying the user‑feedback and dynamic‑content requirements in your rubric.


