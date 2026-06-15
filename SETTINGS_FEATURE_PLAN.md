# User Settings Feature Plan - TractorSewa Application

## Current State
The **Settings** option in the user profile dropdown currently only redirects to `/profile/edit`, which handles profile information editing. This plan proposes a comprehensive Settings page structure with multiple functional categories.

---

## Recommended Settings Structure

### **1. ACCOUNT SETTINGS** (High Priority)
These settings control core account functionality and security.

#### 1.1 Basic Account Information
- **Full Name** - Allow users to update their name
- **Email Address** - Display (with option to change if supported by backend)
- **Phone Number** - Update contact phone
- **WhatsApp Number** - Separate WhatsApp contact
- **Account Status** - Display account status (Active, Suspended, Verified, etc.)
- **Account Creation Date** - Read-only display

#### 1.2 Security & Password
- **Change Password** - Current password → New password → Confirm password
- **Password Strength Indicator** - Visual feedback on password requirements
- **Login Activity** - Display recent login history (dates, times, devices)
- **Active Sessions** - List active sessions with option to logout from specific devices
- **Two-Factor Authentication (2FA)** - Optional: Enable/disable SMS or email-based 2FA
- **Trusted Devices** - Skip 2FA on trusted devices

#### 1.3 Deactivation & Deletion
- **Deactivate Account** - Temporary disable (restore anytime)
- **Permanently Delete Account** - Irreversible account deletion with warning
- **Data Download** - Export personal data before deletion (GDPR/privacy compliance)

---

### **2. PROFILE SETTINGS** (High Priority)
These settings manage how users present themselves on the platform.

#### 2.1 Profile Picture & Bio
- **Profile Photo** - Upload/change avatar
- **Cover Photo** - Optional banner image for profile
- **Bio/Description** - Short biographical text (max 500 characters)
- **Verification Badge** - Display verification status

#### 2.2 Location & Availability
- **State** - Primary operating state
- **District(s)** - Multiple districts they operate in
- **Service Radius** - Maximum distance they can travel (in km)
- **Availability Status** - Set to Available/Busy/Not Available
- **Operating Hours** - Business hours for scheduling
- **Seasonal Availability** - Mark busy seasons (e.g., monsoon, harvest)

#### 2.3 Professional Information (for Operators)
- **Years of Experience** - Operating experience
- **Machine Expertise** - Types of machines they can operate
- **Certifications** - Display relevant certifications
- **Skills/Specializations** - Specific skills and expertise areas

---

### **3. NOTIFICATION SETTINGS** (Medium Priority)
Control how and when users receive notifications.

#### 3.1 Communication Preferences
- **New Messages** - Receive alerts for new messages (Toggle + Frequency)
- **Booking Requests** - Alerts for new rental requests (Push + Email + SMS)
- **Profile Views** - When someone visits their profile
- **Listing Inquiries** - When someone shows interest in listings
- **Promotional Emails** - Opt-in/out of promotional content
- **Platform Updates** - New features, maintenance notifications

#### 3.2 Notification Channels
- **Push Notifications** - Enable/disable browser push
- **Email Notifications** - Enable/disable email alerts
- **SMS Notifications** - Enable/disable SMS alerts
- **WhatsApp Notifications** - Enable/disable WhatsApp alerts (if integrated)
- **Do Not Disturb Hours** - Set quiet hours (e.g., 10 PM - 7 AM)

#### 3.3 Notification Frequency
- **Real-time** - Immediate notifications
- **Daily Digest** - Once per day summary
- **Weekly Digest** - Once per week summary
- **Batched** - Group similar notifications

---

### **4. PRIVACY SETTINGS** (High Priority)
Control data sharing and visibility.

#### 4.1 Profile Visibility
- **Public Profile** - Visible to all users
- **Private Profile** - Only visible to contacts
- **Hidden Profile** - Not visible in search results
- **Show Contact Info** - Display phone/WhatsApp publicly
- **Show Location** - Display exact location vs. approximate area

#### 4.2 Data Sharing & Permissions
- **Share Usage Data** - Allow app to track analytics (for improvement)
- **Share Location Data** - Permit location tracking (when searching)
- **Third-party Integrations** - Allow data sharing with partner services
- **Cookies & Tracking** - Manage tracking cookies

#### 4.3 Contact Preferences
- **Allow Contact Requests** - Control who can message you
- **Block List** - Block specific users
- **Report Filters** - Auto-filter suspicious messages
- **Privacy Level** - Who can see different information categories

---

### **5. LISTING SETTINGS** (Medium Priority)
Manage how listings appear and function.

#### 5.1 Harvester Listing Settings (if user owns harvesters)
- **Default Availability** - Set auto-availability for new listings
- **Pricing** - Manage rental rates and pricing models
- **Availability Calendar** - Mark busy/unavailable dates
- **Auto-renewal** - Auto-renew listings before expiration
- **Listing Visibility** - Active/Inactive listings

#### 5.2 Operator Listing Settings (if user is an operator)
- **Service Areas** - Select districts/regions for service
- **Service Types** - Types of work they accept
- **Booking Preferences** - Minimum booking duration, notice period
- **Pricing** - Daily/hourly rates
- **Availability Calendar** - Mark availability

---

### **6. PREFERENCES & DISPLAY** (Low Priority)
User interface and personal preferences.

#### 6.1 App Display
- **Language** - Select interface language (English, Hindi, Marathi)
- **Theme** - Light/Dark mode (if applicable)
- **Date Format** - DD-MM-YYYY, MM-DD-YYYY, etc.
- **Time Zone** - Select operating timezone
- **Currency Display** - INR (if app expands to multiple countries)

#### 6.2 Default Preferences
- **Default Search Filters** - Remember last used filters
- **Items Per Page** - Pagination preference
- **Map View Default** - Show map by default in search
- **Sorting Preference** - Default sort order (distance, price, rating)

---

### **7. BILLING & PAYMENTS** (Medium Priority)
Payment and financial settings.

#### 7.1 Payment Methods
- **Saved Payment Methods** - Credit card, debit card, UPI, etc.
- **Add Payment Method** - Add new card/payment method
- **Remove Payment Method** - Delete saved cards
- **Default Payment Method** - Select preferred payment method
- **Payment History** - View transaction history

#### 7.2 Billing Information
- **GST/Tax ID** - Business identification (for business users)
- **Billing Address** - Address for invoices
- **Invoice Preferences** - Download or email invoices
- **Subscription Status** - If paid membership exists
- **Wallet/Credits** - Display wallet balance

---

### **8. VERIFICATION & BADGES** (Medium Priority)
Manage verification status and badges.

#### 8.1 Verification Status
- **Email Verification** - Verified/Unverified status + Reverify button
- **Phone Verification** - Verified/Unverified status + Reverify button
- **Identity Verification** - Verified/Unverified + Re-verify option
- **Document Verification** - Government ID, Aadhaar, etc.
- **Social Verification** - Connect social accounts to verify

#### 8.2 Badges & Certifications
- **Verified Badge** - Show/hide verification badge
- **Top Rated Badge** - Earned through ratings
- **Pro/Premium Badge** - If membership exists
- **Display Certificates** - Show professional certifications

---

### **9. SUPPORT & HELP** (Low Priority)
Help, feedback, and support options.

#### 9.1 Support & Contact
- **FAQs** - Link to help documentation
- **Contact Support** - Email/chat support option
- **Report Problem** - Report technical issues
- **Send Feedback** - Feature requests or general feedback
- **Knowledge Base** - Links to tutorials and guides

#### 9.2 Documentation
- **Terms of Service** - Link to terms
- **Privacy Policy** - Link to privacy policy
- **Guidelines** - Community guidelines
- **Safety Tips** - Best practices for platform usage

---

### **10. INTEGRATIONS** (Low Priority - Future Enhancement)
Connect external services.

#### 10.1 Third-party Services
- **Google Account** - Link Google account
- **WhatsApp Business** - For business notifications
- **Calendar Integration** - Sync with Google/Outlook calendar
- **CRM Integration** - For business users
- **Analytics Dashboard** - View performance metrics

---

## Implementation Roadmap

### **Phase 1: MVP (Essential Features)** - Recommended First
**Priority Settings (Account + Profile + Privacy)**
1. Account Settings (Password change, Email verification)
2. Profile Settings (Bio, Location, Availability status)
3. Privacy Settings (Profile visibility, Contact preferences)
4. Notification Settings (Basic email/SMS toggles)
5. Support & Help (FAQ, Contact support)

**Estimated Dev Time**: 2-3 weeks

### **Phase 2: Enhancement** - Next Release
6. Billing & Payments (Payment methods, History)
7. Listing Settings (Availability, Pricing)
8. Verification & Badges (Email/Phone verification)
9. Advanced Privacy Controls

**Estimated Dev Time**: 2 weeks

### **Phase 3: Advanced** - Future
10. Integrations (Google, WhatsApp, Calendar)
11. Analytics Dashboard
12. Advanced Session Management

---

## UI/UX Design Recommendations

### **Layout Approach**
- **Sidebar Menu** - Left sidebar with settings categories
- **Tabbed Interface** - Horizontal tabs for each section
- **Accordion Panels** - Expandable sections for detailed options
- **Card-based Grid** - Group related settings in cards

### **Navigation Pattern**
```
Settings
├── Account Settings
│   ├── Basic Information
│   ├── Security & Password
│   └── Deactivation
├── Profile Settings
│   ├── Photo & Bio
│   ├── Location & Availability
│   └── Professional Info
├── Notifications
│   ├── Communication
│   ├── Channels
│   └── Frequency
├── Privacy
│   ├── Profile Visibility
│   ├── Data Sharing
│   └── Contact Preferences
├── Listings
├── Preferences
├── Billing & Payments
├── Verification
└── Support
```

### **User Experience Best Practices**
- ✅ Save confirmation messages
- ✅ Undo/Rollback options for critical changes
- ✅ Progress indicators for multi-step changes
- ✅ Tooltips explaining each setting
- ✅ Switch toggles for binary options
- ✅ Modals for destructive actions (delete account)
- ✅ Success/error notifications (Toast)
- ✅ Mobile-responsive design
- ✅ Dark mode support (if applicable)

---

## Database Considerations

### **Existing Schema**
Current `users` table has:
- `name`, `email`, `password`, `role`, `state`, `phone`, `bio`, `image_path`, `is_blocked`, `created_at`

### **Potential New Fields** (for Settings expansion)
```sql
ALTER TABLE users ADD COLUMN (
  -- Security
  whatsapp_number VARCHAR(20),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  -- Profile
  cover_photo_path VARCHAR(255),
  service_radius INT,
  years_experience INT,
  
  -- Preferences
  preferred_language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(10) DEFAULT 'light',
  timezone VARCHAR(50),
  
  -- Privacy
  profile_visibility VARCHAR(50) DEFAULT 'public',
  show_contact_info BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT TRUE,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  
  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  
  -- Account Status
  account_status VARCHAR(50) DEFAULT 'active', -- active, deactivated, suspended
  deactivated_at TIMESTAMP NULL,
  deletion_scheduled_at TIMESTAMP NULL
);

-- Settings preferences (JSON or separate table)
CREATE TABLE user_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  notification_preferences JSON,
  privacy_preferences JSON,
  display_preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Endpoints Needed

### **Account Settings**
- `GET /api/settings/account` - Fetch account settings
- `PATCH /api/settings/account` - Update basic info
- `POST /api/settings/password/change` - Change password
- `POST /api/settings/password/reset` - Reset password
- `GET /api/settings/login-activity` - Get login history
- `POST /api/settings/sessions/logout-all` - Logout all sessions
- `POST /api/settings/account/deactivate` - Deactivate account
- `POST /api/settings/account/delete` - Delete account

### **Profile Settings**
- `GET /api/settings/profile` - Fetch profile settings
- `PATCH /api/settings/profile` - Update profile
- `PATCH /api/settings/profile/photo` - Upload profile photo
- `PATCH /api/settings/profile/availability` - Update availability

### **Notification Settings**
- `GET /api/settings/notifications` - Fetch notification preferences
- `PATCH /api/settings/notifications` - Update preferences

### **Privacy Settings**
- `GET /api/settings/privacy` - Fetch privacy settings
- `PATCH /api/settings/privacy` - Update privacy settings
- `GET /api/settings/blocked-users` - Get blocked users list
- `POST /api/settings/blocked-users` - Block a user
- `DELETE /api/settings/blocked-users/:userId` - Unblock user

### **Verification**
- `GET /api/settings/verification` - Get verification status
- `POST /api/settings/verification/email` - Send email verification
- `POST /api/settings/verification/phone` - Send phone verification

---

## Multilingual Considerations

### **New Translation Keys Needed** (for all 3 languages)
```json
{
  "settings": {
    "title": "Settings",
    "account": "Account Settings",
    "profile": "Profile Settings",
    "notifications": "Notifications",
    "privacy": "Privacy",
    "listings": "Listing Settings",
    "preferences": "Preferences",
    "billing": "Billing & Payments",
    "verification": "Verification",
    "support": "Support & Help",
    
    "account": {
      "changePassword": "Change Password",
      "twoFactor": "Two-Factor Authentication",
      "loginActivity": "Login Activity",
      "deactivate": "Deactivate Account",
      "delete": "Permanently Delete Account"
    },
    
    "notifications": {
      "newMessages": "New Messages",
      "bookingRequests": "Booking Requests",
      "profileViews": "Profile Views",
      "email": "Email Notifications",
      "sms": "SMS Notifications",
      "whatsapp": "WhatsApp Notifications"
    },
    
    "privacy": {
      "profileVisibility": "Profile Visibility",
      "publicProfile": "Public Profile",
      "privateProfile": "Private Profile",
      "hiddenProfile": "Hidden Profile",
      "showContactInfo": "Show Contact Information"
    }
  }
}
```

---

## Security & Compliance Checklist

- ✅ Validate all input data
- ✅ Use HTTPS for sensitive operations
- ✅ Implement rate limiting on critical endpoints
- ✅ Log all account changes
- ✅ Send email confirmations for account changes
- ✅ Require password confirmation for sensitive changes
- ✅ Implement GDPR data export functionality
- ✅ Secure 2FA implementation (TOTP or SMS)
- ✅ Hash sensitive data
- ✅ Implement session timeout for security changes

---

## Summary Table

| Category | Priority | Complexity | User Impact | Est. Dev Time |
|----------|----------|-----------|------------|---------------|
| Account Settings | High | Medium | Critical | 5-7 days |
| Profile Settings | High | Low | High | 3-4 days |
| Privacy Settings | High | Medium | High | 5-6 days |
| Notifications | Medium | Low | Medium | 2-3 days |
| Billing & Payments | Medium | High | Medium | 5-7 days |
| Listing Settings | Medium | Medium | Medium | 3-4 days |
| Verification | Medium | Medium | Medium | 3-4 days |
| Preferences | Low | Low | Low | 1-2 days |
| Support & Help | Low | Low | Low | 1 day |
| Integrations | Low | High | Low | 7+ days |
| **TOTAL (MVP)** | - | - | - | **2-3 weeks** |

---

## Next Steps

1. **Review** this plan with the team/stakeholders
2. **Prioritize** which sections to implement in MVP
3. **Design** UI mockups for the Settings page
4. **Create** new translation keys for i18n
5. **Design** database schema updates
6. **Implement** Phase 1 features
7. **Test** thoroughly (unit, integration, E2E tests)
8. **Deploy** and gather user feedback
