# Tractor Seva 🚜

Welcome to the **Tractor Seva** project repository. Tractor Seva is a comprehensive web platform designed to connect agricultural stakeholders, particularly harvester machine owners and tractor operators. It provides a robust marketplace for agricultural equipment and services, along with community features like blogs and direct messaging.

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (built on Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion & GSAP
- **3D Rendering**: Three.js, React Three Fiber, React Three Drei
- **Forms & Validation**: React Hook Form
- **Notifications**: Sonner (Rich Toast Notifications)
- **Internationalization**: i18next
- **Data Visualization**: Recharts
- **Other Utilities**: Embla Carousel, Canvas Confetti, React Day Picker, React Dropzone/Easy Crop

## 🗺️ Application Architecture & Routes

The application features a fully responsive layout with protected routes for authenticated users.

### Public Routes
- `/` - **Landing Page**: The main entry point showcasing the platform's value proposition.
- `/login` & `/register` - **Auth Page**: User authentication handling.
- `/blogs` - **Harvesting Knowledge**: Articles, news, tips, and success stories.
- `/blogs/:id` - **Blog Detail**: Full article view.
- `/enquiry` - **Enquiry Page**: Contact form for general inquiries.

### Protected Routes (Requires Authentication)
- `/dashboard` - **User Dashboard**: Overview of user activity, requests, and listings.
- `/harvesters` - **Explore Harvesters**: Browse available harvester machines.
- `/harvesters/:id` - **Harvester Detail**: View specific machine details and specs.
- `/harvesters/:id/edit` - **Edit Harvester**: Modify a machine listing.
- `/add-harvester` - **Add Harvester**: Create a new machine listing.
- `/operators` - **Explore Operators**: Browse registered tractor operators.
- `/operators/:id` - **Operator Profile**: View an operator's profile, experience, and ratings.
- `/add-operator` - **Add Operator**: Register as an operator.
- `/requests` - **Service Requests**: Browse open requirements for operators or machines.
- `/requests/:id` - **Request Detail**: View a specific requirement and connect with the poster.
- `/messages` - **Messaging**: In-app real-time chat with other users.
- `/profile` - **User Profile**: View current user's profile.
- `/profile/edit` - **Edit Profile**: Update personal details and avatar.
- `/settings` - **Settings**: Account configuration, security, and preferences.
- `/admin` - **Admin Portal**: Administrative dashboard with charts and management tools.

## 📁 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── App.tsx             # Main routing and global providers (Toaster, MessageNotifier)
│   │   └── components/         # Page-level components
│   │       ├── Landing.tsx     # Landing page UI
│   │       ├── Auth.tsx        # Login & Signup flows
│   │       ├── Dashboard.tsx   # Dashboard overview
│   │       ├── Settings.tsx    # User settings panel
│   │       ├── Enquiry.tsx     # Enquiry submission
│   │       ├── Pages.tsx       # Contains major views (Blogs, Harvesters, Operators, Requests)
│   │       └── shared.tsx      # Shared layout components (Navbar, ProtectedRoute)
│   ├── components/
│   │   └── ui/                 # Reusable shadcn/ui and custom UI components
│   └── imports/                # Assets, markdown files, and static data
├── public/                     # Public static assets (images, icons)
├── package.json                # Project dependencies and scripts
└── vite.config.ts              # Vite configuration
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   # or
   pnpm build
   ```

## 🌟 Key Features

- **Interactive UI**: Fluid animations using Framer Motion and GSAP.
- **3D Elements**: Integrated 3D models using React Three Fiber for an immersive experience.
- **Real-time Messaging**: Built-in chat system with global unread message polling/notifications.
- **Location Auto-detection**: Geolocation services for fetching districts and states.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop views.
- **Dark Mode Support**: Theming capabilities powered by `next-themes`.
- **Infinite Scrolling**: Feed-style blog viewing similar to modern social platforms.

---

*This README was generated to provide a comprehensive overview of the Tractor Seva project architecture, routing, and features.*