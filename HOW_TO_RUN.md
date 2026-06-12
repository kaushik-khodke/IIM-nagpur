# 🚜 Tractor Sewa — How to Run

## Prerequisites

Make sure you have the following installed on your system:

| Tool       | Required Version | Check Command      |
|------------|------------------|---------------------|
| **Node.js** | v18 or higher    | `node -v`           |
| **pnpm**    | v8 or higher     | `pnpm -v`           |

> **Don't have pnpm?** Install it globally:
> ```bash
> npm install -g pnpm
> ```

---


## 🚀 Quick Start

Follow these steps to start the database (either using the live shared database or a local instance), the backend API server, and the frontend development server.

### 1. Set Up the Database (Choose Option A or B)

#### Option A: Connect to the Live Shared Cloud Database (Recommended)
We have a live MySQL database hosted on Aiven. By using this database, all team members will share the same real-time data.
* **No database installation is required** on your local machine.
* Simply create a `.env` file inside the `server/` directory and use the shared connection credentials (ask for the password/host or copy them from the shared group).
* Make sure `DB_SSL_REQUIRED=true` is set. The `ca.pem` certificate is already included in the `server/` directory to secure the connection.

#### Option B: Run a Local Database Instance (MariaDB)
If you want to work completely offline, you can run a local MariaDB/MySQL instance:
* **In PowerShell:**
  ```powershell
  & "d:\DEKSTOP_\PROJECT\Tracker-seva\mariadb-extracted\mariadb-10.11.8-winx64\bin\mariadbd.exe" --defaults-file="d:\DEKSTOP_\PROJECT\Tracker-seva\mariadb-data\my.ini"
  ```
* **In Command Prompt (cmd):**
  ```cmd
  "d:\DEKSTOP_\PROJECT\Tracker-seva\mariadb-extracted\mariadb-10.11.8-winx64\bin\mariadbd.exe" --defaults-file="d:\DEKSTOP_\PROJECT\Tracker-seva\mariadb-data\my.ini"
  ```
* *Keep this terminal running.*

---

### 2. Start the Backend API Server

Open a second terminal window, navigate to the `server` directory, and start the Express server:

```bash
cd d:\DEKSTOP_\PROJECT\Tracker-seva\IIM-nagpur\server
npm install
npm run dev
```

*Keep this terminal running.* The backend API will be available at `http://localhost:5000`.

---

### 3. Start the Frontend Development Server

Open a third terminal window, navigate to the `IIM-nagpur` root directory, and start the React/Vite development server:

```bash
cd d:\DEKSTOP_\PROJECT\Tracker-seva\IIM-nagpur
pnpm install
pnpm run dev
```

The app will be available at **http://localhost:5173**.

---

## 📦 Build for Production

To create an optimized production build:

```bash
pnpm run build
```

The output will be in the `dist/` folder, ready to be deployed to any static hosting service.

---

## 🛠 Tech Stack

| Category        | Technology                          |
|-----------------|--------------------------------------|
| **Framework**   | React 18                             |
| **Build Tool**  | Vite 6                               |
| **Styling**     | Tailwind CSS 4 + Emotion             |
| **UI Library**  | MUI (Material UI) 7 + Radix UI      |
| **Routing**     | React Router 7                       |
| **Animations**  | Motion (Framer Motion) + Three.js    |
| **Charts**      | Recharts                             |

---

## 📁 Project Structure

```
Review and Enhance UI/
├── index.html              # Entry HTML file
├── package.json            # Dependencies & scripts
├── pnpm-workspace.yaml     # pnpm workspace config
├── vite.config.ts          # Vite configuration
├── postcss.config.mjs      # PostCSS configuration
├── src/
│   ├── main.tsx            # App entry point
│   ├── app/
│   │   ├── App.tsx         # Root App component
│   │   └── components/     # UI components
│   ├── imports/            # Shared imports & utilities
│   └── styles/             # Global styles
└── guidelines/             # Design guidelines
```

---

## 🗄️ Database Setup for Team Members / Friends

When you push code using Git, your friends will **only** get files located inside the `IIM-nagpur` repository. They will **not** receive the `mariadb-extracted` (binary) or `mariadb-data` (database files) directories, as those reside outside of the repository folder.

However, the project is fully portable. Your friends can set up their own database easily without needing your database files:

### 1. Install a Local MySQL or MariaDB Instance
Your friends should install a standard MySQL or MariaDB server locally. They can do this in several ways:
- **MariaDB Server Installer** (Official installer for Windows/macOS/Linux)
- **MySQL Community Server Installer** (Official installer)
- **XAMPP / WampServer** (Includes a preconfigured MariaDB instance)
- **Docker** (Run `docker run --name mysql-db -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -d mariadb`)

### 2. Configure Environment Variables
Inside the `IIM-nagpur/server` directory:
1. Copy [server/.env.example](file:///d:/DEKSTOP_/PROJECT/Tracker-seva/IIM-nagpur/server/.env.example) to a new file named `.env`.
2. Edit `.env` to match their local database configuration (e.g., set `DB_USER`, `DB_PASSWORD`, and `DB_PORT`).

### 3. Automatic DB and Table Initialization
When they run the backend server (`npm run dev` in `IIM-nagpur/server`), the backend code will **automatically**:
- Create the database named `tractorsewa` (or whatever `DB_NAME` is in `.env`) if it doesn't exist.
- Generate all necessary tables (`users`, `operators`, `harvesters`, `requests`, `messages`, `blogs`).
- Seed the default administrator account (`admin@123` / `123admin@`).

No SQL scripts need to be run manually.

---

## ❓ Troubleshooting

### Port already in use
If port 5173 is occupied, Vite will automatically pick the next available port. Check the terminal output for the correct URL.

### Dependency issues
If you encounter installation errors, try clearing the cache:
```bash
pnpm store prune
pnpm install
```

### Node version mismatch
Make sure you're using Node.js **v18+**. You can use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
```bash
nvm install 18
nvm use 18
```
