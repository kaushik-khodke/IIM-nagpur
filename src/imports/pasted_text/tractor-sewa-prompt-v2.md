Looking at your screenshot and the existing prompt, I can see a solid start — good orange branding, clean hero. Let me craft a significantly upgraded prompt that tightens the design system, adds more agricultural soul, and elevates the visual identity beyond a generic template.
Here's the improved prompt:

TRACTOR SEWA — FULL FRONTEND BUILD PROMPT (v2 — Elevated)

DESIGN PHILOSOPHY
This is not a generic SaaS dashboard with orange buttons. Tractor Sewa serves Indian farmers and rural machine operators — the design must feel grounded in the soil, warm like harvest season, and trusted like a government cooperative office made modern. Think of Amul's bold confidence meets a modern fintech app's clarity.
Mood: Earthy warmth, harvest gold, field green — not startup-corporate.

DESIGN SYSTEM (STRICT — DERIVED FROM AGRICULTURAL INDIA)
Colors:
  --orange-primary:   #E8720C    /* Deeper harvest orange, not flat */
  --orange-light:     #FEF3E2    /* Warm wheat field tint */
  --orange-hover:     #C9610A
  --green-primary:    #15803D    /* Deep crop green */
  --green-light:      #F0FDF4
  --earth-brown:      #92400E    /* Soil accent for borders/icons */
  --soil-dark:        #1C1008    /* Near-black with warm undertone */
  --cream-bg:         #FDFAF4    /* Aged parchment, not clinical white */
  --surface:          #FFFFFF
  --muted-warm:       #78716C
  --border-warm:      #E7E0D5    /* Warmer than gray */
  --error:            #DC2626
  --warning:          #D97706

Typography:
  Display/Headings: 'Sora' (Google Font) — geometric, confident, modern-Indian feel
  Body: 'Inter' — clean, legible
  Accent labels: 'Space Groto' or 'DM Sans' — for badges, stats, chips
  
  Import in index.html:
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

Signature Visual Element:
  A subtle "wheat stalk" SVG watermark pattern used as decorative bg on 
  hero sections and cards — hand-drawn style, very low opacity (3-5%), 
  rendered as an SVG background-image in Tailwind via arbitrary values.

Border Radius:
  Cards: rounded-2xl
  Inputs/Buttons: rounded-xl  
  Badges: rounded-full
  
Shadows:
  Cards: shadow-[0_2px_16px_rgba(232,114,12,0.08)]  /* Orange-tinted shadow */
  Hover: shadow-[0_8px_32px_rgba(232,114,12,0.15)]

Spacing:
  Section padding: py-20 on desktop, py-12 on mobile
  Card gap: gap-6
  
Gradients:
  Hero banner:  bg-gradient-to-br from-[#FDFAF4] via-[#FEF3E2] to-[#F0FDF4]
  Profile cover: bg-gradient-to-r from-[#E8720C] via-[#D97706] to-[#15803D]
  Dashboard welcome: bg-gradient-to-r from-orange-50 to-green-50

TECH STACK (UNCHANGED — STRICT)

React (functional components + hooks only)
Tailwind CSS (all styling — no inline styles, no CSS modules)
React Router v6 (useNavigate, useParams, Link)
shadcn/ui: Button, Card, CardContent, CardHeader, Badge, Input, Select, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogContent, DialogHeader, Avatar, Separator, DropdownMenu, Toast
Lucide React icons throughout
Node.js/Express backend — fetch() or axios for API calls
AWS MySQL via Node.js backend
No hardcoded mock data — all data from API


API STRUCTURE (Node.js + AWS MySQL)
All endpoints same as original spec. Fetch with:
jsheaders: { Authorization: `Bearer ${localStorage.getItem('tractorsewa_token')}` }
Use loading skeletons while fetching. Show error toast on API failure.

ROUTING STRUCTURE (React Router v6)
/                  → Landing Page (public)
/login             → Login
/register          → Register
/dashboard         → Dashboard (protected)
/harvesters        → Explore Harvesters (protected)
/harvesters/:id    → Harvester Detail (protected)
/operators         → Explore Operators (protected)
/operators/:id     → Operator Profile (protected)
/add-harvester     → Add Harvester Form (protected)
/add-operator      → Add Operator Form (protected)
/requests          → My Requests (protected)
/requests/:id      → Request Detail (protected)
/blogs             → Blogs (public)
/blogs/:id         → Blog Detail (public)
/profile           → My Profile (protected)
/profile/edit      → Edit Profile (protected)
/messages          → Messages (protected)
ProtectedRoute checks localStorage.getItem('tractorsewa_token') → redirect /login if missing.

PAGE 1: LANDING PAGE /
Navbar (public variant):

Left: Custom SVG wheat+tractor logomark + "Tractor Sewa" in font-sora font-bold text-[#E8720C] text-xl
Right: [Login] outlined border-orange button + [Sign Up →] filled orange button
Navbar bg: bg-[#FDFAF4]/95 backdrop-blur-sm with border-b border-[#E7E0D5] — sticky top
On mobile: hamburger sheet menu

Hero Section:

Full layout: left text column (60%) + right visual card (40%) on desktop, stacked on mobile
Top eyebrow tag: small pill badge — 🌾 India's Leading Agri-Harvesting Network with bg-orange-100 text-orange-700 border border-orange-200
Headline (3 lines, large):

  Find Skilled
  Harvester Operators          ← this line in #E8720C
  Near You
Font: font-sora font-extrabold text-6xl on desktop, text-4xl on mobile. Line height tight.

Subheadline: text-[#78716C] text-lg max-w-lg leading-relaxed — "Connecting farmers, machine operators, and harvester owners across India. Hire verified workers, rent out machinery, and secure your seasonal crop yield on time."
Two CTAs: [Get Started →] orange filled (bg-[#E8720C] hover:bg-[#C9610A]) + [Explore Platform] outlined (border-2 border-[#E8720C] text-[#E8720C])
Below CTAs: small trust indicators row — ✓ Free to Join  ✓ Verified Profiles  ✓ 50+ Cities

Hero Visual Card (right side):

bg-gradient-to-br from-orange-50 to-green-50 rounded-3xl with subtle border
Large tractor SVG illustration (custom, not just an icon — full tractor side view in orange/earth tones)
Floating info chip: bg-white shadow-md rounded-xl px-3 py-2 — "🌾 Harvesting Rabi & Kharif Crops"
Two additional floating stat chips (positioned absolutely):

Top-right: "500+ Operators Online"
Bottom-left: "Wheat · Rice · Maize · Sugarcane"



Stats Bar:

bg-[#E8720C] full-width section — 4 stats in white
Stats: 500+ Operators Registered | 200+ Harvesters Listed | 50+ Cities Covered | 1000+ Connections Made
Number: font-sora font-bold text-4xl text-white, Label: text-orange-100 text-sm uppercase tracking-widest

How It Works — 4 steps with visual connector line:

Step cards connected by dashed orange line on desktop
Each step: numbered circle (bg-[#E8720C] text-white font-bold), icon, Title, 2-line description
Steps: Register → Create Profile → Find Match → Connect & Harvest

Features Grid — 6 cards in 3×2 grid:

Each card: bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300
Icon in bg-orange-50 rounded-xl p-3 w-fit wrapper
Feature name bold, short desc muted
Features: Operator Search | Harvester Directory | Direct Messaging | Availability Tracking | Requirements Board | Location-Based Filters

Recent Operators — GET /api/operators?limit=4:

Section header: "Meet Skilled Operators" + [View All →] link
Loading: 4 skeleton cards (animate-pulse)
OperatorCard: gradient-top avatar area, Name, Location with MapPin icon, machine badges, AvailabilityBadge, [View Profile] button

Recent Harvesters — GET /api/harvesters?limit=4:

Section header: "Available Machines"
HarvesterCard: machine placeholder with tractor icon on bg-orange-50, name, company badge, location, owner chip

Latest Blogs — GET /api/blogs?limit=3:

3-column cards, category pill badge in green, title, 2-line excerpt, [Read More →]

Footer CTA Banner:

bg-gradient-to-r from-[#E8720C] to-[#15803D] full-width
"Ready to grow your harvest business?" + [Join Tractor Sewa Free →] white button

Footer:

Dark footer: bg-[#1C1008] text-orange-100
Logo, tagline, 3-column quick links, copyright + "Made for Indian Farmers 🇮🇳"


PAGE 2: LOGIN /login

Full page: left panel (bg-gradient-to-br from-[#FEF3E2] to-[#F0FDF4]) with tractor illustration + tagline + 3 trust points; right panel with login card
On mobile: right panel full screen
Card: bg-white rounded-2xl shadow-lg p-8 max-w-md
"Welcome Back 👋" heading in Sora bold
Email Input with Mail icon prefix
Password Input with toggle Eye/EyeOff icon suffix
"Forgot Password?" link right-aligned in orange
[Login to Tractor Sewa] full-width orange button
Divider "or continue with"
Social hint (Google — just UI, no backend needed)
Link: "New here? Create a free account →"
POST /api/auth/login → save tractorsewa_token → navigate /dashboard


PAGE 3: REGISTER /register

Same two-panel layout as login
"Join Tractor Sewa 🌾" heading
Full Name, Email, Password, Confirm Password
Role Selector — styled as three card-toggle buttons (not tabs):

  [🚜 Harvester Owner]  [👨‍🌾 Operator]  [🤝 Both]
Selected: border-2 border-[#E8720C] bg-orange-50 text-[#E8720C]
Unselected: border border-[#E7E0D5] bg-white text-[#78716C]

State/District dropdowns (common Indian states)
Phone number with +91 prefix badge
Checkbox: "I agree to Terms of Service"
[Create Free Account →] full-width green button
POST /api/auth/register → save token → navigate /dashboard


PAGE 4: DASHBOARD /dashboard (protected)
Navbar (authenticated):

Same sticky navbar but with auth variant
Center nav: Home | Harvesters | Operators | Messages | Blogs
[+ Add Listing ▾] DropdownMenu: "+ Add Harvester" | "+ Add Operator"
Right: NotificationBell icon (badge count) + Avatar DropdownMenu:

View Profile | My Harvesters | My Requests | Settings | [Logout] in red



Dashboard Body:

GET /api/auth/me for user name
Welcome Banner: bg-gradient-to-r from-orange-50 via-[#FDFAF4] to-green-50 rounded-2xl p-8

"Good Morning, Rajesh 👋" in font-sora font-bold text-3xl
Subtitle: "What are you looking to do today?"
Quick action chips: [🔍 Find Operator] [🚜 Browse Machines] [📋 Post Requirement]


Two Hero Action Cards (side by side desktop, stacked mobile):

Harvesters Card: bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6

Large Tractor icon, "Browse Machines", count badge, [Explore →]


Operators Card: bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-6

User icon, "Find Operators", count badge, [Explore →]




Recent Operators horizontal scroll section — GET /api/operators?limit=6
Recent Harvesters horizontal scroll section — GET /api/harvesters?limit=6
Activity Feed (right sidebar on desktop, bottom section on mobile):

"Latest Activity" heading
GET /api/requests?limit=5 feed items with icon + text + relative time




PAGE 5: EXPLORE HARVESTERS /harvesters (protected)

PageHeader: "Browse Harvesters 🚜" + result count badge + [+ List Your Machine] green button
Search + Filter Bar (bg-white rounded-2xl p-4 shadow-sm border border-[#E7E0D5]):

Search input with Search icon — debounced 300ms
Filters row: Location | Company | Machine Type — shadcn Select components
[Clear All] text link in orange


GET /api/harvesters?search=&location=&company=&machineType=
Loading: 6 skeleton cards
Grid: 3col lg / 2col md / 1col sm
HarvesterCard (improved):

Top: image area bg-gradient-to-br from-orange-50 to-amber-50 h-44 rounded-t-2xl with Tractor SVG centered
Company badge (top-right absolute)
Body: Machine Name (font-sora font-semibold), Model in muted, Location with MapPin
Owner chip: Avatar (sm) + "Owner: {name}"
[View Details →] full-width orange outlined button
Hover: card lifts with orange shadow




PAGE 6: HARVESTER DETAIL /harvesters/:id (protected)

GET /api/harvesters/:id
Image area: bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl aspect-video with large Tractor SVG
Name as h1 font-sora, Company + Model badges row
Info grid (3 cols): Location | Company | Model with icon + label + value
Owner Card (bg-white rounded-2xl border border-[#E7E0D5] shadow-sm p-6):

Avatar ring-orange, Owner Name, masked phone
WhatsApp button (green with WhatsApp icon) + [Message Owner] orange button
[View Owner Profile →] text link


About Machine section with Separator and description
Related Machines section: 3 small cards from same location


PAGE 7: EXPLORE OPERATORS /operators (protected)

PageHeader: "Find Operators 👨‍🌾" + result count
Same search/filter bar pattern
Filters: Location | Experience (years range) | Machine Type | Availability
GET /api/operators?search=&location=&experience=&machineType=&availability=
OperatorCard (improved):

Top gradient banner: bg-gradient-to-r from-green-50 to-orange-50 h-20 rounded-t-2xl
Avatar centered, overlapping banner bottom edge, ring-2 ring-[#E8720C]
Name, Location, AvailabilityBadge (prominent)
Machine expertise: scrollable badge chips
Experience: {n} Years Experience with Award icon
[View Profile →] full-width button




PAGE 8: OPERATOR PROFILE /operators/:id (protected)

GET /api/operators/:id
Cover Banner: bg-gradient-to-r from-[#E8720C] via-[#D97706] to-[#15803D] h-48 rounded-b-3xl
Avatar (xl, ring-4 ring-white) overlapping bottom of banner
Name font-sora font-bold text-2xl, Location, Phone masked, WhatsApp
Stats row: {n} Years Exp | {machines.length} Machine Types | Availability
AvailabilityBadge prominent below name
About card with description
Machine Expertise section — badge cluster
Listed Machines grid — GET /api/harvesters?operatorId=:id
[Contact Operator] sticky bottom bar on mobile


PAGE 9: ADD OPERATOR FORM /add-operator (protected)

PageHeader: "Register as Operator 👨‍🌾"
Stepper UI (3 steps): [1 Basic Info] → [2 Skills & Equipment] → [3 Contact]
Wrapped in bg-white rounded-2xl shadow-sm border border-[#E7E0D5] p-8 max-w-2xl mx-auto

Step 1 — Basic Info:

Profile Photo: drag-drop zone (border-2 border-dashed border-[#E8720C] rounded-2xl bg-orange-50 py-10 text-center) with Upload icon, "Drop your photo here or click to upload", preview on select
Full Name — Input with User icon
Experience — Input type number + "years" suffix badge
Location — Input with MapPin icon
State — Select (Indian states list)

Step 2 — Skills & Equipment:

Machine Expertise — chip multi-select:

  [Combine Harvester ✓] [Rice Harvester] [Wheat Harvester] 
  [Maize Harvester] [Sugarcane Harvester] [+ Custom]
Selected chips: bg-orange-100 border-orange-300 text-orange-700

Availability toggle buttons (3):

  [✓ Available]  [⏳ Busy]  [✗ Not Available]
Each a styled button, selected state has colored bg

Description — Textarea with char counter

Step 3 — Contact:

Phone Number — Input with Phone icon + +91 prefix
WhatsApp — Input with WhatsApp SVG icon (green) + +91 prefix
[← Back] outlined + [Submit Profile →] orange filled
POST /api/operators → success Toast → navigate /dashboard


PAGE 10: ADD HARVESTER FORM /add-harvester (protected)

Same stepper/card layout pattern
PageHeader: "List Your Harvester 🚜"

Fields:

Machine Image: same drag-drop zone style
Machine Name — Input with Tractor icon
Company — Select: John Deere | Claas | Mahindra | New Holland | AGCO | Preet | Sonalika | Other
Model — Input
Year of Manufacture — Input type number
Location — Input with MapPin
State — Select (Indian states)
Phone + WhatsApp with +91 prefix
Description — Textarea
[Submit Listing →] full-width green Button
POST /api/harvesters → success Toast → navigate /harvesters


PAGE 11: REQUESTS /requests (protected)

PageHeader: "My Requirements 📋" + [+ Post Requirement] orange button (opens Dialog)

Create Request Dialog (shadcn Dialog, max-w-lg):

Type Toggle: [👨‍🌾 Need Operator]  [🚜 Need Harvester]
Selected: filled orange or green depending on type
Location, Machine Type, Experience Required, Duration (days), Start Date, Description
[Post Requirement →] orange Button

Tabs: Need Operator | Need Harvester — shadcn Tabs
RequestCard (improved):

Left color stripe (3px): orange for operator need, green for harvester need
Type badge, Location + MapPin, Machine Type, Duration, Start Date
Status badge: Open (green) | Closed (gray)
Row of actions: [View Details] + edit pencil icon + trash icon (with confirm Dialog)


PAGE 12: REQUEST DETAIL /requests/:id (protected)

GET /api/requests/:id
Large type badge header
Detail grid: Location | Machine Type | Experience | Duration | Start Date
Full description card
Separator
Requester card: Avatar, Name, masked Phone, WhatsApp
[Message User →] full-width orange button
POST /api/messages → success Toast


PAGE 13: BLOGS /blogs (public)

PageHeader: "Harvesting Knowledge 📚"
Search input full-width
Category pills (horizontal scroll):
All | Harvesting Tips | Machine Maintenance | Success Stories | Agri News | Weather & Season
Active: bg-[#E8720C] text-white, Inactive: bg-white border border-[#E7E0D5] text-[#78716C]
GET /api/blogs?category=&search=
3col/2col/1col grid
BlogCard (improved):

Cover: bg-gradient-to-br from-green-50 to-orange-50 h-48 rounded-t-2xl with crop/article icon
Category badge (green), Date (muted), Title (font-sora font-semibold), 2-line excerpt
[Read More →] orange text link with arrow




PAGE 14: BLOG DETAIL /blogs/:id (public)

GET /api/blogs/:id
Cover image full-width rounded-2xl aspect-video bg-gradient-to-br from-green-50 to-orange-50
Breadcrumb: Blogs / {category} / {title}
Category badge + Author avatar + date row
h1 font-sora font-bold text-4xl
Content sections rendered from array
Author card at bottom: Avatar, Name, role badge
Related Blogs — horizontal 3-card row


PAGE 15: MY PROFILE /profile (protected)

GET /api/auth/me + GET /api/operators?userId=me + GET /api/harvesters?userId=me
Cover: bg-gradient-to-r from-[#E8720C] to-[#15803D] h-52 rounded-b-3xl
Avatar xl with white ring, overlapping cover
Name, Location, AvailabilityBadge, role badges
Stats row: Harvesters Listed | Operators | Requests Posted
[Edit Profile ✎] button top-right
About section
My Harvesters grid
My Requests list (recent 3)
Settings Card: Edit Profile | Change Password | [Logout] red


SHARED COMPONENTS
ProtectedRoute       — token check → /login redirect
Navbar               — variant: "public" | "auth"
OperatorCard         — id, name, location, experience, machineExpertise[], availability, avatarUrl
HarvesterCard        — id, machineName, company, model, location, ownerName, imageUrl
BlogCard             — id, title, category, shortDescription, coverImageUrl, date
RequestCard          — id, type, location, machineType, status, onDelete, onEdit
AvailabilityBadge    — status: "Available"(green) | "Busy"(yellow) | "Not Available"(red)
FilterBar            — filters[], onFilterChange
SkeletonCard         — animate-pulse loading placeholder
PageHeader           — title, subtitle, action
LoadingSpinner       — centered orange spinner
ErrorState           — message, onRetry button
EmptyState           — icon, title, description, actionLabel, onAction
StepperForm          — steps[], currentStep, onNext, onBack (used in add forms)

GLOBAL STATE & AUTH

JWT stored in localStorage key: tractorsewa_token
All protected API calls: Authorization: Bearer <token> header
On logout: clear token + navigate /


RESPONSIVE BREAKPOINTS

sm (mobile): 1-col grids, stacked layouts, hamburger nav, bottom action bars on detail pages
md (tablet): 2-col grids
lg (desktop): 3-col grids, sidebar layouts, sticky sidebars


UX DETAILS & POLISH

Loading: skeleton cards on every API fetch — match exact card shape
Errors: red Toast + ErrorState component with retry button
Empty states: friendly message + relevant CTA (not just "No data found")
Delete: always confirm via shadcn Dialog before DELETE call
Toasts: green for success, red for error — always describe the action ("Profile created successfully!")
Forms: red border + helper text below invalid fields, validate before submit
Navigation: React Router ONLY — zero window.location, zero <a href>
Transitions: transition-all duration-200 on interactive elements; hover:scale-[1.02] on cards
Mobile bottom bar: on Operator/Harvester detail pages, sticky [Contact] button bar on mobile
Indian context: state names, crop types (Wheat, Rice, Paddy, Maize, Sugarcane, Soybean), and machine brands should reflect Indian market (Mahindra, Preet, Sonalika alongside John Deere)


START ORDER
Build in this sequence:

App.jsx — all routes + ProtectedRoute + font imports
components/Navbar.jsx — both variants
pages/Landing.jsx — full landing page
pages/Dashboard.jsx
Then remaining pages in route order

Use font-['Sora'] for all headings via Tailwind arbitrary value.

This is the complete improved prompt. Key upgrades over v1:

Richer color system — deeper orange, warm cream bg, earth tones instead of generic off-white
Sora font — gives it a distinctly modern-Indian agritech personality instead of generic Inter-everywhere
Orange-tinted shadows — cards feel warm, not corporate gray
Stepper forms — multi-step UX for the add operator/harvester flows
Split-panel auth pages — login/register feel premium
Indian market specifics — state selectors, Indian machine brands, crop names
Sticky mobile contact bars on detail pages — mobile-first UX
Gradient cards on dashboard — colored action cards instead of flat white
Wheat stalk watermark — the one signature decorative element tying it to agriculture
