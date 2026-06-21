# 🚜 Tractor Seva

Tractor Seva is a premium, feature-rich web platform designed to digitalize and streamline agricultural services in India. It serves as an interactive marketplace connecting harvester owners, tractor operators, and farmers, enabling seamless equipment rental, service request matching, direct communication, and knowledge sharing.

---

## 🌟 Key Features

* **Equipment Marketplace**: Harvester owners can list their machines with technical specifications, descriptions, location, and photos.
* **Operator Directory**: Tractor operators can register profiles displaying their experience, machine expertise, availability, and reviews.
* **Service Requests Portal**: Farmers can post active requirements for machines or operators, allowing service providers to connect with them directly.
* **In-App Messaging**: Built-in real-time chat system with message indicators and direct communication links (including WhatsApp integration).
* **Interactive 3D Visualizations**: A modern landing experience with immersive 3D tractor elements using Three.js and React Three Fiber.
* **Multilingual Localization**: Full support for English and regional Indian languages (e.g., Marathi) using `i18next`.
* **Ratings & Reviews**: A rating system for machines and operators to build community trust and verify service quality.
* **Knowledge Hub (Blogs)**: A responsive blog feed with view counts, likes, and comment features.
* **Admin Portal**: An administrative dashboard featuring real-time platform statistics (active users, listings, enquiry rates), user moderation (blocking/unblocking accounts), and system control panels.

---

## 🚀 Tech Stack

### Frontend
* **Core**: React 18, Vite 6, Typescript
* **Routing**: React Router v7
* **Styling**: Tailwind CSS v4, Vanilla CSS variables
* **UI Components**: shadcn/ui, Radix UI primitives, Material UI (MUI)
* **Animations**: Framer Motion, GSAP (GreenSock)
* **3D Engine**: Three.js, React Three Fiber, React Three Drei
* **Localization**: `i18next` & `react-i18next`
* **Data Visualization**: Recharts
* **State & Forms**: React Hook Form, Sonner (Toasts), React Easy Crop

### Backend & Storage
* **Server Framework**: Node.js, Express.js
* **File Uploads**: Multer (Local staging)
* **Cloud Storage**: Supabase Storage Integration (Automatic upload and cleanup of media assets)
* **Logging**: Winston logger for structured server access and error logs

### Database & Security
* **Database**: MySQL / MariaDB
* **ORM / Query Engine**: Raw SQL queries with `mysql2/promise` connection pooling
* **Auth**: JWT (JSON Web Tokens), bcryptjs (password hashing)
* **Security Headers**: Helmet
* **Rate Limiter**: Express Rate Limit (DDoS and brute-force protection)
* **Validator**: Express Validator (Input sanitization and validation)

---

## 🗺️ Application Architecture & Routes

The application features a fully responsive layout with protected routes for authenticated users.

### Public Routes
* `/` — **Landing Page**: Entry page highlighting features and interactive 3D elements.
* `/login` & `/register` — **Authentication**: Safe login and registration flows.
* `/blogs` — **Harvesting Knowledge**: Blogs list.
* `/blogs/:id` — **Blog Detail**: Full view with likes and comments.
* `/enquiry` — **Enquiry**: Generic enquiry form for offline matching.

### Protected Routes (Requires Auth)
* `/dashboard` — **User Dashboard**: Summary of user listings, requests, and active status.
* `/harvesters` — **Browse Harvesters**: Feed of available combine harvesters.
* `/harvesters/:id` — **Harvester Details**: Details, contact methods, and ratings.
* `/harvesters/:id/edit` — **Edit Harvester**: Modify harvester listings.
* `/add-harvester` — **Add Harvester**: Create a new machine listing.
* `/operators` — **Explore Operators**: Directory of tractor operators.
* `/operators/:id` — **Operator Profile**: Work experience and ratings.
* `/add-operator` — — **Register Operator**: Join the operator directory.
* `/requests` — **Service Requests**: Browse open agricultural jobs.
* `/requests/:id` — **Request Details**: View job requirements and connect with the poster.
* `/messages` — **Inbox**: Direct real-time chat with other users.
* `/profile` & `/profile/edit` — **User Profile**: Modify personal details and upload avatars.
* `/settings` — **Preferences**: Configure notification settings, privacy, and account security.
* `/admin` — **Admin Portal**: Admin panel with charts, user moderation table, and content managers.

---

## 📁 Project Structure

```text
IIM-nagpur/
├── server/                     # Backend Express server
│   ├── logs/                   # Winston output logs (error.log, combined.log)
│   ├── uploads/                # Local temporary upload staging
│   ├── ca.pem                  # Database SSL Certificate
│   ├── db.js                   # Database pool, auto-initialization & seeding
│   ├── server.js               # Express application and API route declarations
│   └── package.json            # Backend scripts and dependencies
├── src/                        # Frontend source code
│   ├── app/
│   │   ├── App.tsx             # Routing configuration and global contexts
│   │   └── components/         # Page components
│   │       ├── Auth.tsx        # Authentication flows
│   │       ├── Landing.tsx     # 3D interactive landing page
│   │       ├── Dashboard.tsx   # User panel
│   │       ├── Pages.tsx       # Core views (Blogs, Harvesters, Operators, Requests, Admin)
│   │       ├── Settings.tsx    # App preference management
│   │       └── shared.tsx      # Protected routes, Navbar, Footer
│   ├── components/
│   │   └── ui/                 # Reusable shadcn/ui components
│   ├── imports/                # Localization JSON files, image references, and static assets
│   └── main.tsx                # Frontend entry point
├── public/                     # Public static assets (models, fallback images)
├── vite.config.ts              # Vite configurations
├── tailwind.config.js          # Tailwind CSS configurations
├── package.json                # Root package (coordinates installation)
└── README.md                   # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **pnpm** (v8 or higher) or **npm**

---

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd IIM-nagpur
   ```

2. **Install Dependencies**:
   The root project has a `postinstall` script configured to automatically install all dependencies for both the root (frontend) and the `server` directory. Run:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or inside the `server/` directory) and populate it with the following configuration:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_must_be_at_least_32_characters
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tractorsewa
   DB_SSL_REQUIRED=false
   ```

4. **Start the Database**:
   Ensure your local MySQL / MariaDB server is active, or use a remote MySQL database instance (by providing corresponding host/ssl variables).

5. **Run the Application**:
   You can start both the backend API server and the frontend Vite server.
   
   * **To run the backend server**:
     ```bash
     cd server
     npm run dev
     ```
     The backend API will start at `http://localhost:5000`.
     
   * **To run the frontend server**:
     In a new terminal window in the root directory, run:
     ```bash
     pnpm run dev
     # or
     npm run dev
     ```
     The frontend application will be active at `http://localhost:5173`.

---

## 🗄️ Database Auto-Initialization & Seeding

The server features an automated database initializer (`server/db.js`). When you start the backend server for the first time, it will automatically:
1. Create the database (`tractorsewa`) if it does not exist.
2. Initialize all necessary table schemas (`users`, `operators`, `harvesters`, `requests`, `enquiries`, `messages`, `blogs`, `blog_likes`, `blog_comments`, `ratings`, `login_logs`).
3. Migrate newer column updates (like `views`, `whatsapp`, `bio`, `image_path`, security fields) seamlessly.
4. Seed default blog posts and set up a hardcoded Administrator account:
   * **Admin Email**: `admin@gmail.com`
   * **Admin Password**: `123123pass`

---

## 🔒 Security Practices

This project implements enterprise-level security practices to protect user data:
* **Password Hashing**: Cryptographically strong passwords using `bcryptjs` with salt rounds.
* **Session Protection**: JWT authentication tokens with signature validation.
* **HTTP Security**: Integrated `helmet` middleware for protecting against cross-site scripting (XSS), clickjacking, and mime-sniffing.
* **API Rate Limiting**: Limit active requests per IP address for public APIs, with extra strict limits on login/registration endpoints to mitigate brute force attacks.
* **Robust Sanitization**: Type and schema validation via `express-validator` to block SQL injection and malformed parameters.