# Settings Page - UI/UX Layout Guide

## Page Structure & Navigation

### **Desktop Layout**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NAVBAR (STICKY)                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ← Back to Dashboard    SETTINGS                        [Language ▼]     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  LEFT SIDEBAR (280px)         │  MAIN CONTENT AREA (Flexible)           │
│  ─────────────────────────     │                                         │
│                                │  ┌─────────────────────────────────┐   │
│  ✓ Account                     │  │ ACCOUNT SETTINGS                │   │
│    • Basic Information         │  ├─────────────────────────────────┤   │
│    • Security & Password       │  │ Basic Information                │   │
│    • Login Activity            │  │ ─────────────────────────────── │   │
│    • Deactivation              │  │                                  │   │
│                                │  │ [Full Name]          [Input]    │   │
│  • Profile                     │  │                                  │   │
│  • Notifications               │  │ [Email Address]      [Display]  │   │
│  • Privacy                     │  │                                  │   │
│  • Listings                    │  │ [Phone Number]       [Input]    │   │
│  • Preferences                 │  │                                  │   │
│  • Billing                     │  │ [WhatsApp Number]    [Input]    │   │
│  • Verification                │  │                                  │   │
│  • Support                     │  │ Account Status: [Active ✓]      │   │
│                                │  │                                  │   │
│                                │  │ ┌──────────────────────────────┐│   │
│                                │  │ │ SECURITY & PASSWORD          ││   │
│                                │  │ ├──────────────────────────────┤│   │
│                                │  │ │                              ││   │
│                                │  │ │ [Change Password]   [Button] ││   │
│                                │  │ │ [2FA Setup]         [Toggle] ││   │
│                                │  │ │                              ││   │
│                                │  │ └──────────────────────────────┘│   │
│                                │  │                                  │   │
│                                │  │ ┌──────────────────────────────┐│   │
│                                │  │ │ LOGIN ACTIVITY               ││   │
│                                │  │ ├──────────────────────────────┤│   │
│                                │  │ │ Recent logins:               ││   │
│                                │  │ │ • Today at 10:30 AM         ││   │
│                                │  │ │ • Yesterday at 2:15 PM      ││   │
│                                │  │ │ • 2 days ago at 5:00 PM     ││   │
│                                │  │ │ [View Full History]         ││   │
│                                │  │ └──────────────────────────────┘│   │
│                                │  │                                  │   │
│                                │  │ ┌──────────────────────────────┐│   │
│                                │  │ │ DANGER ZONE                  ││   │
│                                │  │ ├──────────────────────────────┤│   │
│                                │  │ │ [Deactivate Account] [Red]   ││   │
│                                │  │ │ [Delete Account]     [Red]   ││   │
│                                │  │ └──────────────────────────────┘│   │
│                                │  │                                  │   │
│                                │  │ [← Back to Previous]  [Save Changes] [Cancel] │
│                                │  └─────────────────────────────────┘   │
│                                │                                         │
│                                │                                         │
│                                │                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section Details & Components

### **1. ACCOUNT SETTINGS**

#### Basic Information Card
```
┌────────────────────────────────────────────┐
│ BASIC INFORMATION                          │
├────────────────────────────────────────────┤
│                                            │
│ Full Name                                  │
│ [________________________] (Input Field)   │
│ Your name appears on your profile         │
│                                            │
│ Email Address                              │
│ [________________________] (Read-only)    │
│ You can't change email currently          │
│ [Request Email Change]                   │
│                                            │
│ Phone Number                               │
│ [________________________] (Input Field)   │
│ This is shown to potential clients        │
│                                            │
│ WhatsApp Number                            │
│ [________________________] (Input Field)   │
│ For easier communication                  │
│                                            │
│ Account Status                             │
│ [Active] ✓ | Created on Dec 15, 2024      │
│                                            │
│ [Save Changes]  [Cancel]                   │
└────────────────────────────────────────────┘
```

#### Security & Password Card
```
┌────────────────────────────────────────────┐
│ SECURITY & PASSWORD                        │
├────────────────────────────────────────────┤
│                                            │
│ Change Password                            │
│ ┌──────────────────────────────────────┐  │
│ │ Current Password: [________]         │  │
│ │ New Password:     [________]         │  │
│ │ Password Strength: [████████░░] 80%  │  │
│ │ Requirements:                        │  │
│ │ ✓ At least 8 characters             │  │
│ │ ✓ Uppercase and lowercase           │  │
│ │ ✗ Numbers                           │  │
│ │ ✗ Special characters                │  │
│ │ Confirm Password: [________]        │  │
│ │ [Update Password]  [Cancel]         │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Two-Factor Authentication                  │
│ [OFF ⊙] ← Enable 2FA for extra security  │
│                                            │
│ Login Alerts                               │
│ [ON ●] Get notified of new logins         │
│                                            │
└────────────────────────────────────────────┘
```

---

### **2. PROFILE SETTINGS**

#### Profile Picture & Bio
```
┌────────────────────────────────────────────┐
│ PROFILE PICTURE & BIO                      │
├────────────────────────────────────────────┤
│                                            │
│ Profile Picture                            │
│ ┌──────────────────────────────────────┐  │
│ │                                      │  │
│ │     ┌────────────────────────────┐   │  │
│ │     │   [Profile Photo]          │   │  │
│ │     │   (150x150px)              │   │  │
│ │     │   [Upload New Photo]       │   │  │
│ │     │   [Remove Photo]           │   │  │
│ │     └────────────────────────────┘   │  │
│ │                                      │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Biography                                  │
│ [________________________________________________]│
│ [________________________________________________]│
│ [________________________________________________]│
│ 0 / 500 characters                         │
│                                            │
│ [Save Changes]                             │
└────────────────────────────────────────────┘
```

#### Location & Availability
```
┌────────────────────────────────────────────┐
│ LOCATION & AVAILABILITY                    │
├────────────────────────────────────────────┤
│                                            │
│ Primary State                              │
│ [Maharashtra ▼]                            │
│                                            │
│ Operating Districts                        │
│ ☑ Nagpur    ☑ Wardha    ☑ Amravati       │
│ ☑ Akola     ☐ Yavatmal  ☐ Washim        │
│ [+ Add More Districts]                     │
│                                            │
│ Service Radius                             │
│ [_______] km from your location            │
│                                            │
│ Availability Status                        │
│ ◉ Available                                │
│ ○ Busy                                     │
│ ○ Not Available                            │
│                                            │
│ Operating Hours                            │
│ From: [08:00 ▼]  To: [06:00 ▼]           │
│                                            │
│ Seasonal Notes                             │
│ [________________________________________________]│
│ e.g., Unavailable during monsoon         │
│                                            │
│ [Save Changes]  [Cancel]                   │
└────────────────────────────────────────────┘
```

---

### **3. NOTIFICATIONS SETTINGS**

```
┌────────────────────────────────────────────┐
│ NOTIFICATIONS PREFERENCES                  │
├────────────────────────────────────────────┤
│                                            │
│ COMMUNICATION PREFERENCES                  │
│                                            │
│ New Messages                               │
│ [ON ●] Get notified when someone messages │
│ Frequency: [Real-time ▼]                  │
│                                            │
│ Booking Requests                           │
│ [ON ●] Get notified of new booking requests│
│ Frequency: [Real-time ▼]                  │
│                                            │
│ Profile Views                              │
│ [OFF ⊙] Get notified when viewed         │
│                                            │
│ Promotional Emails                         │
│ [OFF ⊙] Latest offers and promotions     │
│                                            │
│ ─────────────────────────────────────────  │
│ NOTIFICATION CHANNELS                      │
│                                            │
│ ☑ Email Notifications                     │
│ ☑ Push Notifications                      │
│ ☑ SMS Notifications                       │
│ ☐ WhatsApp Notifications                  │
│                                            │
│ ─────────────────────────────────────────  │
│ DO NOT DISTURB                             │
│                                            │
│ Enable Do Not Disturb                      │
│ [ON ●] Mute notifications during hours    │
│                                            │
│ From: [10:00 PM ▼]   To: [07:00 AM ▼]   │
│                                            │
│ [Save Preferences]                         │
└────────────────────────────────────────────┘
```

---

### **4. PRIVACY SETTINGS**

```
┌────────────────────────────────────────────┐
│ PRIVACY & VISIBILITY                       │
├────────────────────────────────────────────┤
│                                            │
│ PROFILE VISIBILITY                         │
│                                            │
│ ◉ Public Profile (Visible to all users)   │
│ ○ Private Profile (Friends only)          │
│ ○ Hidden Profile (Not visible in search)  │
│                                            │
│ ℹ️ Your public profile can be found in     │
│    search results and directory           │
│                                            │
│ ─────────────────────────────────────────  │
│ CONTACT INFORMATION                        │
│                                            │
│ ☑ Show phone number on profile            │
│ ☑ Show WhatsApp number on profile        │
│ ☑ Show location on profile                │
│ ☐ Show exact location (vs approximate)   │
│                                            │
│ ─────────────────────────────────────────  │
│ CONTACT REQUESTS                           │
│                                            │
│ Allow contact from:                        │
│ ◉ Everyone                                 │
│ ○ Verified users only                     │
│ ○ Nobody (use contact form only)          │
│                                            │
│ ─────────────────────────────────────────  │
│ BLOCKED USERS                              │
│                                            │
│ You have blocked 2 users                   │
│ [View Blocked List]  [Edit]                │
│                                            │
│ [Save Privacy Settings]                    │
└────────────────────────────────────────────┘
```

---

### **5. VERIFICATION SETTINGS**

```
┌────────────────────────────────────────────┐
│ VERIFICATION & BADGES                      │
├────────────────────────────────────────────┤
│                                            │
│ VERIFICATION STATUS                        │
│                                            │
│ ✓ Email Verified      (Dec 15, 2024)     │
│   [Reverify Email]                         │
│                                            │
│ ✗ Phone Verified      (Not verified)      │
│   [Verify Phone]  [Send OTP]               │
│                                            │
│ ✗ Identity Verified   (Not verified)      │
│   [Upload Identity Documents]              │
│   ℹ️ Verified users get higher search ranking │
│                                            │
│ ─────────────────────────────────────────  │
│ DISPLAY BADGES                             │
│                                            │
│ ☑ Show verification badges on profile     │
│ ☑ Show "Top Rated" badge (earned)        │
│ ☐ Show professional certifications        │
│                                            │
│ Your Badges:                               │
│ 🏆 Verified Account  ⭐ 4.8 Star Rating   │
│                                            │
└────────────────────────────────────────────┘
```

---

## Mobile Responsive Layout

### **Mobile View (Stack Layout)**

```
┌────────────────────────────────┐
│        SETTINGS                 │
├────────────────────────────────┤
│                                │
│ [Account ▼]                    │
│ ┌──────────────────────────┐   │
│ │ Basic Information        │   │
│ │ Security & Password      │   │
│ │ Login Activity           │   │
│ └──────────────────────────┘   │
│                                │
│ [Profile ▼]                    │
│ [Notifications ▼]              │
│ [Privacy ▼]                    │
│ [Verification ▼]               │
│ [Support ▼]                    │
│                                │
│ Expandable Accordion Pattern    │
│                                │
└────────────────────────────────┘
```

---

## Interactive Components Specification

### **Toggle Switch Component**
```
OFF State:     [⊙ ────────]
ON State:      [──────── ●]

Used for: 2FA, Notifications, Privacy settings
Color OFF: Gray (#E2E8F0)
Color ON: Blue (#172263)
```

### **Dropdown/Select Component**
```
┌─────────────────────────────┐
│ Select State        [▼]     │
├─────────────────────────────┤
│ ✓ Maharashtra               │
│ • Andhra Pradesh            │
│ • Assam                     │
│ • Bihar                     │
│ • (scroll for more)         │
└─────────────────────────────┘
```

### **Card Component**
```
┌─ SECTION TITLE ───────────────────┐
│ Content inside card               │
│                                   │
│ With consistent padding (1.5rem)  │
│ Gray background (#F5F5F5)         │
│ Rounded corners (8px)             │
│ Border: 1px solid (#E2E8F0)       │
└───────────────────────────────────┘
```

### **Button Styles**

**Primary Button (Save Changes)**
```
┌─────────────────────┐
│  SAVE CHANGES       │
│ Background: #172263 │
│ Color: White        │
│ Hover: #11194A      │
│ Radius: 8px         │
└─────────────────────┘
```

**Secondary Button (Cancel)**
```
┌─────────────────────┐
│  CANCEL             │
│ Background: #F5F5F5 │
│ Color: #57585A      │
│ Border: 1px #E2E8F0 │
│ Radius: 8px         │
└─────────────────────┘
```

**Danger Button (Delete)**
```
┌─────────────────────┐
│  DELETE             │
│ Background: #DC2626 │
│ Color: White        │
│ Hover: #991B1B      │
│ Radius: 8px         │
└─────────────────────┘
```

---

## Form Field Validation States

### **Valid Input**
```
☑ Full Name
[John Doe ✓]
Help text in green
```

### **Invalid Input**
```
✗ Email Address
[invalid@email ✗]
Error message in red: "Invalid email format"
```

### **In Progress**
```
⟳ Phone Verification
[+91 98765 43210 ⟳]
"Sending OTP..."
```

---

## Modals & Dialogs

### **Change Password Modal**
```
┌────────────────────────────────────┐
│ CHANGE PASSWORD                    │
├────────────────────────────────────┤
│                                    │
│ Current Password                   │
│ [________________________]          │
│                                    │
│ New Password                       │
│ [________________________]          │
│ Strength: Strong [████████░░]     │
│                                    │
│ Confirm Password                   │
│ [________________________]          │
│                                    │
│ [Update Password]  [Cancel]        │
│                                    │
└────────────────────────────────────┘
```

### **Delete Account Confirmation**
```
┌────────────────────────────────────┐
│ ⚠️  DELETE ACCOUNT                  │
├────────────────────────────────────┤
│                                    │
│ Are you sure? This action cannot   │
│ be undone. All your data will be   │
│ permanently deleted.               │
│                                    │
│ Type "CONFIRM DELETE" to proceed:  │
│ [________________________]          │
│                                    │
│ [Delete Permanently] [Cancel]      │
│                                    │
└────────────────────────────────────┘
```

---

## Sidebar Navigation (Desktop)

```
┌─────────────────┐
│ SETTINGS        │
├─────────────────┤
│                 │
│ ACCOUNT         │
│ • Basic Info    │ ← Current section
│ • Security      │   (highlighted)
│ • Login Activity│
│ • Deactivation │
│                 │
│ PROFILE         │
│ • Picture & Bio │
│ • Location      │
│ • Professional  │
│                 │
│ NOTIFICATIONS   │
│                 │
│ PRIVACY         │
│                 │
│ LISTINGS        │
│                 │
│ PREFERENCES     │
│                 │
│ BILLING         │
│                 │
│ VERIFICATION    │
│                 │
│ SUPPORT         │
│                 │
└─────────────────┘
```

---

## Tab Navigation (Mobile Alternative)

```
┌──────────────────────────────────────┐
│ Account │ Profile │ Notif. │ ...    │
├──────────────────────────────────────┤
│ Account Settings content below       │
│ (tabs scroll horizontally)           │
└──────────────────────────────────────┘
```

---

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Blue | #172263 |
| Secondary | Light Blue | #E0E7FF |
| Success | Green | #10B981 |
| Warning | Orange | #F59E0B |
| Error | Red | #DC2626 |
| Background | White | #FFFFFF |
| Card Background | Light Gray | #F5F5F5 |
| Border | Gray | #E2E8F0 |
| Text Primary | Dark | #1A1A1A |
| Text Secondary | Gray | #57585A |

---

## Accessibility Features

- ✓ Proper label associations with form fields
- ✓ ARIA attributes for complex components
- ✓ Keyboard navigation (Tab, Enter, Escape)
- ✓ Focus indicators on all interactive elements
- ✓ Color contrast ratio ≥ 4.5:1
- ✓ Screen reader friendly structure
- ✓ Skip navigation links
- ✓ Error messages linked to form fields
- ✓ Loading states clearly indicated

---

## Loading & Empty States

### **Loading State**
```
⟳ Loading your settings...
[Spinner animation]
```

### **Empty State (No blocked users)**
```
📭 No blocked users
You haven't blocked anyone yet.
```

### **Error State**
```
⚠️ Error loading settings
Something went wrong. Please try again.
[Retry Button]
```

---

## Success Feedback

### **Toast Notification**
```
✓ Changes saved successfully!
[X]
(Auto-dismisses after 3 seconds)
```

### **Inline Confirmation**
```
✓ Profile updated
Your changes have been saved.
[Dismiss]
```

---

## Performance Optimization

- **Lazy Load Sections**: Load only active section content
- **Debounced Save**: Debounce auto-save on input (500ms)
- **Pagination**: Paginate login history/activity
- **Infinite Scroll**: For blocked users list if large
- **Caching**: Cache read-only data (states, districts)
- **Code Splitting**: Split settings into separate chunks

---

## Responsive Breakpoints

```
Mobile:   < 640px  (Full-width stacked)
Tablet:   640px-1024px  (2-column layout)
Desktop:  > 1024px  (Sidebar + main)
```
