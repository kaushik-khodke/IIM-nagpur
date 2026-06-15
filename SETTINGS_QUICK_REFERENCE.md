# Settings Feature - Quick Reference Summary

## Current State
The Settings option currently links to `/profile/edit` with minimal functionality.

## Proposed Settings Structure (10 Categories)

### 🔐 **1. ACCOUNT SETTINGS** (Must-Have)
- Change password with security checks
- Login activity & device management
- 2FA setup (optional)
- Account deactivation/deletion
- View account status & creation date

### 👤 **2. PROFILE SETTINGS** (Must-Have)
- Profile picture, cover photo, bio
- Location & operating area
- Availability status (Available/Busy/Not Available)
- Professional info (experience, skills, expertise)
- Service radius & operating hours

### 🔔 **3. NOTIFICATIONS** (Should-Have)
- Message alerts, booking requests, profile views
- Toggle channels: Email, SMS, WhatsApp, Push
- Do-Not-Disturb hours
- Daily/Weekly digest options

### 🔒 **4. PRIVACY** (Must-Have)
- Profile visibility (Public/Private/Hidden)
- Contact info visibility
- Data sharing permissions
- Block list management
- Location sharing control

### 📋 **5. LISTING SETTINGS** (Should-Have)
- Auto-renewal for listings
- Pricing management
- Availability calendar
- Service area selection
- Default listing visibility

### ⚙️ **6. PREFERENCES & DISPLAY** (Nice-to-Have)
- Language selection (EN, HI, MR)
- Theme (Light/Dark)
- Date/Time format
- Timezone
- Default sort order

### 💰 **7. BILLING & PAYMENTS** (Should-Have)
- Saved payment methods
- Add/remove/set default payment
- Payment history
- GST/Tax ID
- Invoice preferences

### ✅ **8. VERIFICATION** (Should-Have)
- Email verification status
- Phone verification status
- Identity verification
- Reverify options
- Show/hide badges

### 💬 **9. SUPPORT & HELP** (Nice-to-Have)
- FAQs & knowledge base
- Contact support
- Report issues
- Send feedback
- Terms & Privacy links

### 🔗 **10. INTEGRATIONS** (Future)
- Google account linking
- WhatsApp Business
- Calendar sync
- CRM integration
- Analytics dashboard

---

## Implementation Priority

### **Phase 1 - MVP (2-3 weeks)** ✨ START HERE
1. **Account Settings** - Password, 2FA, Login activity
2. **Profile Settings** - Bio, Location, Availability
3. **Privacy Settings** - Profile visibility, Blocks
4. **Notifications** - Email/SMS toggles, Do-Not-Disturb
5. **Support & Help** - FAQ, Contact support

### **Phase 2 - Enhancement (2 weeks)**
6. Billing & Payments
7. Listing Settings
8. Verification & Badges
9. Advanced Privacy Controls

### **Phase 3 - Advanced (Future)**
10. Integrations & Analytics

---

## Recommended UI Pattern

```
┌─ SETTINGS PAGE ──────────────────────────┐
│                                           │
│ SIDEBAR           │    MAIN CONTENT      │
│                   │                       │
│ • Account         │  Account Settings    │
│ • Profile         │  ─────────────────  │
│ • Notifications   │  □ Change Password  │
│ • Privacy         │  □ Login Activity   │
│ • Listings        │  □ 2FA Setup        │
│ • Preferences     │  □ Deactivate       │
│ • Billing         │                       │
│ • Verification    │  [Save] [Cancel]    │
│ • Support         │                       │
│                   │                       │
└───────────────────────────────────────────┘
```

---

## Database Changes Needed

**New fields to add to `users` table:**
- `whatsapp_number` - WhatsApp contact
- `cover_photo_path` - Cover image
- `service_radius` - Operating distance
- `preferred_language` - EN/HI/MR
- `profile_visibility` - public/private/hidden
- `notifications_email` - Boolean
- `notifications_sms` - Boolean
- `email_verified` - Boolean
- `phone_verified` - Boolean
- `do_not_disturb_start` - Time
- `do_not_disturb_end` - Time
- `two_factor_enabled` - Boolean

**New table for flexible settings:**
```sql
user_settings (id, user_id, notification_preferences JSON, 
               privacy_preferences JSON, display_preferences JSON)
```

---

## New API Endpoints (Phase 1)

```
GET/PATCH  /api/settings/account
POST       /api/settings/password/change
GET        /api/settings/login-activity
GET/PATCH  /api/settings/notifications
GET/PATCH  /api/settings/privacy
POST       /api/settings/blocked-users
GET        /api/settings/verification
POST       /api/settings/verification/email
POST       /api/settings/verification/phone
```

---

## Multilingual Support

**New translation keys for all 3 languages (EN, HI, MR):**

```json
{
  "settings.account": "Account Settings",
  "settings.profile": "Profile Settings",
  "settings.notifications": "Notifications",
  "settings.privacy": "Privacy",
  "settings.listings": "Listing Settings",
  "settings.preferences": "Preferences",
  "settings.billing": "Billing & Payments",
  "settings.verification": "Verification",
  "settings.support": "Support & Help",
  "settings.changePassword": "Change Password",
  "settings.twoFactor": "Two-Factor Authentication",
  "settings.profileVisibility": "Profile Visibility",
  "settings.notifications.email": "Email Notifications",
  "settings.notifications.sms": "SMS Notifications",
  "settings.account.delete": "Permanently Delete Account",
  ...
}
```

---

## User Types Considerations

### **For Harvester Owners:**
- Harvester listing settings
- Rental rates & pricing
- Availability calendar
- Service areas

### **For Operators:**
- Service types & expertise
- Operator experience
- Booking preferences
- Professional skills

### **For Both:**
- Account, Profile, Notifications, Privacy
- Verification, Support
- General Preferences

---

## Security Checklist

- ✅ Password change requires current password confirmation
- ✅ Email confirmation for account deletion
- ✅ Rate limiting on sensitive endpoints
- ✅ Audit logs for all account changes
- ✅ HTTPS for all communications
- ✅ 2FA support
- ✅ Session timeout after inactivity
- ✅ GDPR compliance (data export)

---

## Design Considerations

- **Responsive** - Mobile-friendly (tabs to collapsible sections on mobile)
- **Accessible** - Proper labels, aria attributes, keyboard navigation
- **Intuitive** - Clear section organization, helpful tooltips
- **Consistent** - Match existing TractorSewa design system
- **Performant** - Lazy-load tabs, debounce input changes
- **Translatable** - All strings use i18n keys

---

## Decision Points for Team

1. **2FA Approach**: SMS only or also support authenticator apps?
2. **Data Export**: Include full data export for privacy compliance?
3. **Account Deletion**: Soft delete (keep data) or hard delete?
4. **Theme Support**: Implement dark mode now or later?
5. **Payment Integration**: Integrate Razorpay/PayU or display payment info only?

---

## Timeline Estimate

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| Design & Planning | UI mockups, API design, DB schema | 3-5 days | 📋 Plan |
| Development Phase 1 | Account + Profile + Privacy + Notifications | 2 weeks | ⏳ Not Started |
| Testing Phase 1 | Unit tests, integration tests, UAT | 3-4 days | ⏳ Not Started |
| Development Phase 2 | Billing + Listings + Verification | 2 weeks | ⏳ Not Started |
| Testing Phase 2 | Full system testing, performance tuning | 3-4 days | ⏳ Not Started |
| Deployment | Staging → Production | 1-2 days | ⏳ Not Started |

**Total MVP Timeline: 4-5 weeks**

---

## Files to Create/Modify

**New Files:**
- `src/app/components/Settings.tsx` - Main settings page
- `src/i18n/locales/en/settings.json` - English translations
- `src/i18n/locales/hi/settings.json` - Hindi translations
- `src/i18n/locales/mr/settings.json` - Marathi translations
- Server: `/api/settings/*` endpoints

**Modified Files:**
- `src/app/components/shared.tsx` - Update dropdown to link to `/settings`
- `src/app/App.tsx` - Add `/settings` route
- `server/schema.md` - Update with new fields
- `server/db.js` - Add new database migrations
- `package.json` - Add any new dependencies if needed

---

## Key Benefits

✅ **Better User Control** - Users manage their account experience  
✅ **Improved Engagement** - Notification preferences reduce fatigue  
✅ **Enhanced Privacy** - Privacy controls build user trust  
✅ **Professional Appearance** - Shows serious platform features  
✅ **Competitive Feature** - Standard on similar platforms  
✅ **Data Compliance** - GDPR/privacy regulation support  

---

## Questions to Discuss

- [ ] Which phase 1 features are critical for launch?
- [ ] Are there regulatory/compliance requirements?
- [ ] Should we support SSO (Google, Facebook)?
- [ ] Any analytics requirements for tracking?
- [ ] Who owns each section? (Frontend dev, Backend dev, Designer)
- [ ] Budget/resource constraints?
- [ ] Timeline flexibility?
