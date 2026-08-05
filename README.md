Contacts App — Full-stack contact manager

Lightweight contact manager showcasing secure authentication and authorization, sessions, and a polished vanilla-JS UI.

This README was updated to reflect recent UX improvements, import/export features, and backend bulk import support.

Highlights
-- Login through username or email
-- Client-side validation (login/signup/contact forms)
-- Modal-based create/edit flows with inline error banners
-- Search and inline filtering on the dashboard
-- Import contacts (CSV / JSON) and export (CSV / JSON)

Tech stack

- Node.js, Express
- SQLite (app.db) + connect-sqlite3 sessions
- bcryptjs for password hashing
- Vanilla HTML/CSS/JS frontend (no frameworks)

Quick start

1. Install dependencies

```bash
npm install
```

2. Start the server

```bash
npm start
```

3. Open http://localhost:3000

Folders

- `server.js` — App entry
- `database.js` — SQLite initialization and schema
- `controller/` — Request handlers for auth and contacts
- `public/` — Frontend (HTML/CSS/JS)

New and notable features

- Search & filtering: Dashboard includes a search box that filters contacts by name, phone, and address in real time.
- Import: Upload CSV or JSON files via the dashboard header; parsed items are bulk-inserted for the logged-in user.
  - CSV requires headers: `Name,Phone,Address` (case-insensitive).
  - JSON expects an array of objects: `[ { name, phone, address }, ... ]`.
- Export: Download your contacts as CSV or JSON (client-side export).
- Improved UX: friendlier placeholders, inline field errors, modal banners for modal-specific errors, shorter action buttons, and a clearer empty state.

API endpoints

Authentication

- `POST /api/auth/signup` — Register { username, email, password, confirmPassword }
- `POST /api/auth/login` — Login with `{ usernameOrEmail, password }` (frontend still posts `username` field but it accepts email)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current session user

Contacts

- `GET /api/data` — Get all contacts for current user
- `POST /api/data` — Create a contact `{ name, phone, address }`
- `PUT /api/data/:id` — Update a contact
- `DELETE /api/data/:id` — Delete a contact
- `POST /api/data/import` — Bulk import contacts `{ contacts: [ { name, phone, address }, ... ] }`

Notes on import/export

- CSV parsing is basic and expects the three headers. Quoted values are supported in exports.
- The import endpoint validates presence of `name`, `phone`, and `address` and returns a `createdCount` and optional `errors` array when some rows fail.

Development notes

- Database file: `app.db` (created automatically)
- Sessions: stored in SQLite via `connect-sqlite3`
- To change server port, update `server.js` or set `PORT` env var before running

Future improvements (ideas)

- Real-time sync (WebSockets) for collaborative edits
- CSV import preview and mapping UI
- Inline editing on contact cards (no modal)
- PWA support / offline-first syncing
- OCR business-card scanner for quick contact capture

Contributing

Open issues or PRs are welcome. This project is intentionally minimal — keep changes focused and backward compatible.

License

MIT
