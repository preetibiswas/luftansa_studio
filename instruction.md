# How to run this project locally

This app uses **two processes**: a **Python (FastAPI)** API for mock login and a **Next.js** frontend. Run them in **two separate terminals** from the project root (`luftansa_poc`).

## Prerequisites

- **Node.js** (for Next.js)
- **Python 3.10+** (for FastAPI)

## One-time setup

From the project root:

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic
```

On Windows, activate the venv with `.venv\Scripts\activate` instead of `source .venv/bin/activate`.

Copy or configure environment files as needed (see **Environment** below). The repo ignores `.env*` so your keys stay local.

---

## Terminal 1 — Python API (mock auth)

From the project root, with the virtual environment **activated**:

```bash
cd /path/to/luftansa_poc
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API base URL: `http://localhost:8000`
- Mock login: `POST http://localhost:8000/auth/login` with JSON body `{ "email": "you@example.com" }`

Leave this terminal running.

---

## Terminal 2 — Next.js frontend

Open a **new** terminal from the project root:

```bash
cd /path/to/luftansa_poc
npm run dev
```

- App URL: [http://localhost:3000](http://localhost:3000) (default Next.js dev port)

Leave this terminal running.

---

## Environment

- **Login page → Python API:** The frontend uses `NEXT_PUBLIC_API_URL` if set; otherwise it defaults to `http://localhost:8000`. To point at another host, add to `.env.local`:

  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- **AI / dashboard features:** Configure keys and model settings in `.env.local` as needed for `/api/*` routes (see `TECHNOLOGY_STACK.md`). Those routes run inside Next.js and do not require the Python server.

---

## Stopping

Press **Ctrl+C** in each terminal to stop that server.
