# ascend

> Personal finance dashboard — track income, taxes, loans & investments.

## Tech Stack

| Layer      | Technology             |
|-----------|------------------------|
| Frontend  | React 18 + Vite        |
| Backend   | Node.js + Express      |
| Database  | SQLite (better-sqlite3) |

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Install root devDependencies (concurrently)
npm install

# Run both servers in parallel
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Project Structure

```
ascend/
├── server/            # Express API + SQLite
│   ├── index.js       # Routes & server
│   └── database.js    # Schema & DB init
├── client/            # React + Vite
│   └── src/
│       ├── pages/     # Dashboard, TaxPlanner, LoanExtinguisher, Investments
│       └── components/# Sidebar
├── package.json       # Root scripts
└── README.md
```

## API Endpoints

| Method | Endpoint               | Description         |
|--------|------------------------|---------------------|
| CRUD   | `/api/income`          | Monthly income      |
| CRUD   | `/api/taxes`           | Tax prepayments     |
| CRUD   | `/api/loans`           | Loan tracking       |
| CRUD   | `/api/investments`     | Crypto & transfers  |
| GET    | `/api/dashboard/summary` | Aggregated overview |
