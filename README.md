# AI-Based Online Hotel Reservation System (Flask + SQLite + React)

Full-stack Final Year Project with:
- Flask REST APIs + SQLite (SQLAlchemy)
- React (Vite) + Tailwind CSS
- JWT authentication + bcrypt password hashing
- Rule-based “AI” room recommendations (explainable logic)
- Admin Panel with RBAC (manage hotels/rooms/bookings)

## 1) Run Backend (Flask)

```powershell
cd d:\Zain\hotel-ai-reservation\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py
python app.py
```

Backend URL: `http://127.0.0.1:5000`

## 2) Run Frontend (React)

```powershell
cd d:\Zain\hotel-ai-reservation\frontend
copy .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Admin Account (Seeded)

- Email: `admin@test.com`
- Password: `123456`
- Admin Login Page: `http://localhost:5173/admin/login`

## REST API Endpoints

Auth:
- `POST /signup`
- `POST /login`

Recommendation:
- `POST /recommend` (JWT)
- `GET /user/insights` (JWT)

User browsing:
- `GET /hotels`
- `GET /rooms`
- `GET /rooms/filter`

Booking:
- `POST /book` (JWT)
- `GET /user/bookings` (JWT)

Payment (demo-only):
- `POST /payment` (JWT)

Admin (JWT + role=admin):
- `POST /admin/login`
- `GET /admin/dashboard`
- `POST/GET/PUT/DELETE /admin/hotels`
- `POST/PUT/DELETE /admin/rooms`
- `GET /admin/bookings`
- `PUT /admin/bookings/<id>`

## Viva-ready explanation (quick)

- Passwords are stored as bcrypt hashes in SQLite (never plain text).
- JWT protects APIs; admin routes additionally check `users.role == "admin"`.
- Booking availability blocks overlap using:
  `start < existing_end AND end > existing_start`
- “AI” is rule-based so you can explain every decision (people count + budget + optional AC preference + history insights).

