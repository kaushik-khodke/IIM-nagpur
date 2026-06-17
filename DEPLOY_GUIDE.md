# Tracker Seva — Deployment Guide

This guide provides step-by-step instructions for deploying the **Tracker Seva** application:
1. **Backend Server (Node.js/Express & MySQL)** deployed on **Render**
2. **Frontend client (React & Vite)** deployed on **Vercel**

---

## 📋 Table of Contents
1. [Backend Deployment (Render)](#1-backend-deployment-render)
2. [Frontend Deployment (Vercel)](#2-frontend-deployment-vercel)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Verification Checklist](#4-verification-checklist)

---

## 1. Backend Deployment (Render)

### Step 1: Create a Render Web Service
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (or use a public Git URL).

### Step 2: Configure Web Service Settings
Provide the following settings in the Render creation wizard:
- **Name**: `tracker-seva-backend` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Select the region closest to your users.
- **Branch**: `main`
- **Root Directory**: `server` 
  *(⚠️ IMPORTANT: This tells Render to build and run commands inside the `server` directory)*
- **Build Command**: `pnpm install` (or `npm install` depending on your package manager)
- **Start Command**: `node server.js`
- **Instance Type**: **Free** (or any tier of your choice)

### Step 3: Add Environment Variables
Click **Advanced** and add the following Environment Variables:
- `PORT`: `10000` (or leave empty, Render binds its own port automatically)
- `DB_HOST`: `mysql-6843131-ombhurke101-5783.e.aivencloud.com`
- `DB_PORT`: `17085`
- `DB_USER`: `avnadmin`
- `DB_PASSWORD`: `AVNS_apWnsRczElWirfRnJbb`
- `DB_NAME`: `defaultdb`
- `DB_SSL_REQUIRED`: `true`
- `JWT_SECRET`: `supersecretjwtkeyforsecurity_12345` *(Should be at least 32 characters long)*
- `FRONTEND_URL`: `https://your-frontend-app.vercel.app` *(Change this to your actual Vercel URL once deployed)*

### Step 4: Deploy
Click **Create Web Service**. Render will install dependencies, automatically verify the cloud MySQL connection, and start the server. Copy the public Render service URL (e.g. `https://tracker-seva-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite` (Vercel will auto-detect this)
- **Root Directory**: *Keep empty (use root)*
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `dist`

### Step 3: Configure Environment Variables
Under the **Environment Variables** section, add the following key and value:
- **Key**: `VITE_BACKEND_URL`
- **Value**: `https://tracker-seva-backend.onrender.com` *(Replace this with your actual Render backend URL)*

### Step 4: Deploy
Click **Deploy**. Vercel will build your static files and deploy the app. Vercel will provide you with a production URL (e.g., `https://tracker-seva.vercel.app`).

---

## 3. Environment Variables Reference

### Backend `.env` (Render Settings)
| Variable | Value | Description |
|---|---|---|
| `DB_HOST` | `mysql-6843131-ombhurke101-5783.e.aivencloud.com` | Aiven Cloud MySQL host |
| `DB_PORT` | `17085` | Aiven Cloud MySQL port |
| `DB_USER` | `avnadmin` | Database username |
| `DB_PASSWORD` | `AVNS_apWnsRczElWirfRnJbb` | Database password |
| `DB_NAME` | `defaultdb` | Target database name |
| `DB_SSL_REQUIRED` | `true` | Requires SSL connection (needed for Aiven) |
| `JWT_SECRET` | *[Your Secret]* | Secrets for user authentication (min. 32 chars) |
| `FRONTEND_URL` | `https://[app].vercel.app` | CORS whitelist for requests |

### Frontend `.env` (Vercel Settings)
| Variable | Value | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `https://[backend].onrender.com` | Production URL of Express server |

---

## 4. Verification Checklist

1. **Routing check**: Visit a page (e.g. `/settings`) and refresh your browser. Vercel should read `vercel.json` and serve the page correctly without returning a 404.
2. **CORS check**: Open browser console, try to log in or retrieve lists. There should be no CORS error blocking request headers.
3. **Seeding check**: The backend dynamically seeds the system administrator account (`admin@123` / password: `123admin@`) on startup if it doesn't already exist.
4. **Image Uploads check**: Uploading images uploads them to Supabase cloud storage dynamically and updates the database, ensuring files work without requiring local storage.
