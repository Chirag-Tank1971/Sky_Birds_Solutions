# Admin Dashboard - Course Platform

React + Vite + Tailwind CSS admin panel connected to the Node/Express API.

## Features

- Admin Login (JWT)
- Dashboard with live stats
- Manage Platforms (CRUD)
- Manage Courses + Videos (CRUD)
- Manage Customers (view, block/unblock, delete)
- Responsive design
- Toast notifications

## Setup

```bash
cd admin-dashboard
npm install
npm run dev
```

Dashboard runs on: **http://localhost:3000**

Make sure the backend API is running on **http://localhost:5000**

## Admin credentials

There are no safe default production credentials. Create or reset an administrator through your controlled database/operations process. The API rejects the publicly disclosed demo password `admin123` in production. The login screen keeps its original appearance; enter the real administrator password.

## API Configuration

The API base URL is set in `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Vite also proxies `/api` and `/uploads` to the backend during development.
