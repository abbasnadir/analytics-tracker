# MetricFlow

MetricFlow has 4 parts:

- `apps/sdk` = browser tracking script
- `services/backend` = main API
- `services/analyzer` = Python metrics worker
- `apps/dashboard` = analytics UI

Whole app rule:

- SDK talks to backend
- analyzer talks to backend
- dashboard talks to backend
- backend talks to MongoDB

Simple architecture file: [ARCHITECTURE.md](./ARCHITECTURE.md)  
API contract file: [api.yml](./api.yml)

## Team Split

- Person 1: SDK
- Person 2: backend
- Person 3: Python analyzer
- Person 4: dashboard

Each person should mostly stay in own folder.

## Project Shape

```text
.
├── apps/
│   ├── dashboard/
│   └── sdk/
├── services/
│   ├── analyzer/
│   └── backend/
├── ARCHITECTURE.md
├── api.yml
├── package.json
└── README.md
```

## What You Need

- Git
- VS Code
- Node.js 20+
- Python 3.11+
- MongoDB connection string

For noob setup, easiest DB option is MongoDB Atlas free cluster.

## Super Simple Setup

### 1. Clone project

```bash
git clone <your-github-repo-url>
cd <your-repo-folder>
```

### 2. Install Node packages

```bash
npm install
```

### 3. Create env files

Mac/Linux:

```bash
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp services/analyzer/.env.example services/analyzer/.env
```

Windows PowerShell:

```powershell
Copy-Item services/backend/.env.example services/backend/.env
Copy-Item apps/dashboard/.env.example apps/dashboard/.env.local
Copy-Item services/analyzer/.env.example services/analyzer/.env
```

### 4. Put MongoDB URI in backend env

Open `services/backend/.env.example` and copy values into `services/backend/.env`.

Important:

- set `MONGODB_URI` to your Atlas/local MongoDB connection string
- keep `PORT=4000`
- keep `DEFAULT_API_KEY=mf_demo_key` for now

Example:

```env
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metricflow
CORS_ORIGIN=http://localhost:3000
DEFAULT_API_KEY=mf_demo_key
```

### 5. Set up Python once

Mac/Linux:

```bash
cd services/analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cd ../..
```

Windows PowerShell:

```powershell
cd services/analyzer
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]
cd ../..
```

## How To Run

Open 3 terminals.

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:dashboard
```

Terminal 3, Mac/Linux:

```bash
cd services/analyzer
source .venv/bin/activate
metricflow-analyzer
```

Terminal 3, Windows:

```powershell
cd services/analyzer
.\.venv\Scripts\Activate.ps1
metricflow-analyzer
```

SDK person builds when needed:

```bash
npm run build:sdk
```

## What Connects To What

### SDK -> backend

- route: `POST /api/v1/events`
- sends raw browser events

### analyzer -> backend

- route: `GET /api/v1/analyzer/events`
- route: `POST /api/v1/analyzer/summaries`
- analyzer never reads DB directly

### dashboard -> backend

- route: `GET /api/v1/metrics/overview`
- dashboard only shows ready data

## Easy Rule For Group

If confused:

1. Start backend first
2. Check `api.yml`
3. Change only your folder
4. Do not let frontend or Python touch DB directly
