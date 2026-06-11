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

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
pnpm install
```

### 2. Start the Development Server

```bash
pnpm run dev
```

The app will be available at **http://localhost:5173** (default Vite port).

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
