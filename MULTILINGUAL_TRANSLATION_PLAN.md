# Comprehensive Multilingual Translation Plan
## IIM-Nagpur Tractor Seva Project

---

## Executive Summary
The project currently has i18n infrastructure (i18next + react-i18next) with translations in **English**, **Hindi**, and **Marathi**. However, many hardcoded strings and dynamic content remain untranslated. This plan ensures **100% multilingual coverage** across the entire application.

---

## Phase 1: Audit & Inventory
### 1.1 Identify All Untranslated Content

#### A. Hardcoded Data Arrays/Objects
**Location: `src/app/components/Pages.tsx` and `Auth.tsx`**
- [ ] `MACHINE_TYPES` - Machine categories (Combine Harvester, Rice Harvester, etc.)
- [ ] `COMPANIES` - Equipment manufacturers (John Deere, Claas, Mahindra, etc.)
- [ ] `HARVESTER_MODELS` - Model numbers for each manufacturer
- [ ] `INDIAN_STATES` - All 28 Indian states
- [ ] Districts mapping by state

**Location: `src/app/components/Landing.tsx`**
- [ ] `steps` array - How it works steps
- [ ] `features` array - Feature descriptions
- [ ] Testimonials data

#### B. UI Text Strings in Components
**Location: Multiple TSX files**
- [ ] Button labels (Save, Cancel, Delete, Edit, Add, Submit, etc.)
- [ ] Form field labels and placeholders
- [ ] Error/validation messages
- [ ] Toast notifications
- [ ] Modal headers and descriptions
- [ ] Section titles and descriptions
- [ ] Table headers and column names
- [ ] Empty state messages
- [ ] Loading states
- [ ] Status labels (Active, Inactive, Pending, Completed, etc.)
- [ ] Filter option labels

#### C. API Response Messages
**Location: Throughout components**
- [ ] Error messages from server
- [ ] Success messages
- [ ] Confirmation dialogs
- [ ] Validation feedback

#### D. Database-driven Content
**Location: Server responses**
- [ ] User-generated content (descriptions, reviews)
- [ ] Blog post titles and content
- [ ] Listing descriptions
- [ ] User profiles

#### E. Email Templates & Notifications
**Location: `server/` (if applicable)**
- [ ] Email templates
- [ ] SMS/notification templates

---

## Phase 2: Translation File Structure
### 2.1 Recommended File Organization

```
src/i18n/locales/
├── en/
│   ├── common.json          ✓ (exists)
│   ├── auth.json            ✓ (exists)
│   ├── dashboard.json       ✓ (exists)
│   ├── pages.json           ✓ (exists)
│   ├── messages.json        ✓ (exists)
│   ├── validation.json      ✓ (exists)
│   ├── static.json          ✓ (exists)
│   ├── filters.json         ✗ NEW - Filter options, machine types, companies
│   ├── status.json          ✗ NEW - Status labels
│   ├── placeholders.json    ✗ NEW - Form placeholders
│   └── errors.json          ✗ NEW - API error messages
├── hi/
│   └── (same structure as en)
└── mr/
    └── (same structure as en)
```

### 2.2 New JSON Files Needed

#### `filters.json` - Machine types, companies, states, districts
```json
{
  "machineTypes": {
    "combineHarvester": "Combine Harvester",
    "riceHarvester": "Rice Harvester",
    ...
  },
  "companies": {
    "johnDeere": "John Deere",
    "claas": "Claas",
    ...
  },
  "states": {
    "maharashtra": "Maharashtra",
    "punjab": "Punjab",
    ...
  }
}
```

#### `status.json` - Status labels and states
```json
{
  "booking": {
    "pending": "Pending",
    "confirmed": "Confirmed",
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "listing": {
    "active": "Active",
    "inactive": "Inactive",
    "discontinued": "Discontinued"
  }
}
```

#### `placeholders.json` - Form input placeholders
```json
{
  "search": "Search...",
  "enterName": "Enter your name",
  ...
}
```

#### `errors.json` - Error messages
```json
{
  "network": "Network connection failed",
  "unauthorized": "You are not authorized",
  ...
}
```

---

## Phase 3: Component-by-Component Translation Strategy

### 3.1 High Priority Components (70% of content)

#### **Auth.tsx**
- [ ] INDIAN_STATES array → Move to `filters.json`
- [ ] Form labels (Email, Password, Full Name, Phone, etc.)
- [ ] Validation error messages
- [ ] Submit button text
- [ ] Terms and conditions text
- [ ] Sign-up/Sign-in instructions
- [ ] Password requirements
- [ ] Error messages (User exists, Invalid credentials, etc.)

#### **Landing.tsx**
- [ ] Page title and subtitle
- [ ] Feature descriptions
- [ ] How it works steps
- [ ] CTA buttons text
- [ ] Testimonial headers
- [ ] Section headings
- [ ] Feature cards content

#### **Pages.tsx (ExploreOperators & ExploreHarvesters)**
- [ ] Filter labels (Machine Type, Company, State, District, Search)
- [ ] MACHINE_TYPES → Move to `filters.json`
- [ ] COMPANIES → Move to `filters.json`
- [ ] HARVESTER_MODELS keys → Move to `filters.json`
- [ ] Table column headers
- [ ] Sorting option labels
- [ ] No results messages
- [ ] Pagination text
- [ ] Card descriptions

#### **Dashboard.tsx**
- [ ] Dashboard title
- [ ] Section headers (Recent Operators, Recent Harvesters, Activity)
- [ ] Column headers
- [ ] Empty state messages
- [ ] Widget titles
- [ ] Filter buttons

### 3.2 Medium Priority Components (20% of content)

#### **Enquiry.tsx**
- [ ] Enquiry form labels
- [ ] Form validation messages
- [ ] Submit confirmation
- [ ] Enquiry status labels

#### **shared.tsx**
- [ ] Navigation menu items
- [ ] Navbar branding text
- [ ] Language selector labels
- [ ] Modal titles and content
- [ ] Empty state messages

#### **Other UI Components**
- [ ] Common buttons text
- [ ] Toast notifications
- [ ] Loading indicators text
- [ ] Confirmation dialogs

### 3.3 Low Priority Components (10% of content)

#### **Utility Components**
- [ ] Console errors
- [ ] Debug messages
- [ ] Help text
- [ ] Comments in code

---

## Phase 4: Implementation Strategy

### 4.1 Configuration Update

**Update `src/i18n/config.ts`:**
```typescript
import enFilters from './locales/en/filters.json';
import enStatus from './locales/en/status.json';
import enPlaceholders from './locales/en/placeholders.json';
import enErrors from './locales/en/errors.json';
// ... same for hi and mr

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    pages: enPages,
    messages: enMessages,
    validation: enValidation,
    static: enStatic,
    filters: enFilters,        // NEW
    status: enStatus,          // NEW
    placeholders: enPlaceholders, // NEW
    errors: enErrors           // NEW
  },
  // ... repeat for hi and mr
};
```

### 4.2 Component Refactoring Pattern

**BEFORE (Hardcoded):**
```typescript
const MACHINE_TYPES = ["Combine Harvester", "Rice Harvester", "Wheat Harvester"];

export function ExploreHarvesters() {
  const [machineType, setMachineType] = useState("");
  
  return (
    <select value={machineType} onChange={(e) => setMachineType(e.target.value)}>
      {MACHINE_TYPES.map(type => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
  );
}
```

**AFTER (Translated):**
```typescript
export function ExploreHarvesters() {
  const { t } = useTranslation(['filters', 'common']);
  const [machineType, setMachineType] = useState("");
  
  const machineTypes = Object.values(t('machineTypes', { returnObjects: true }) || {});
  
  return (
    <select value={machineType} onChange={(e) => setMachineType(e.target.value)}>
      {machineTypes.map((type, idx) => (
        <option key={idx} value={type}>{type}</option>
      ))}
    </select>
  );
}
```

### 4.3 Helper Function for Dynamic Content

**Create `src/i18n/translations.ts`:**
```typescript
import { useTranslation } from 'react-i18next';

export function useTranslationData() {
  const { t } = useTranslation(['filters', 'status', 'placeholders', 'errors']);
  
  return {
    machineTypes: Object.values(t('machineTypes', { returnObjects: true })),
    companies: Object.values(t('companies', { returnObjects: true })),
    states: Object.values(t('states', { returnObjects: true })),
    bookingStatus: t('booking', { returnObjects: true }),
    listingStatus: t('listing', { returnObjects: true }),
  };
}
```

---

## Phase 5: Content to Translate

### 5.1 Data Arrays

#### Machine Types (6 items)
```
English: Combine Harvester, Rice Harvester, Wheat Harvester, Maize Harvester, Sugarcane Harvester, Paddy Harvester
Hindi: कंबाइन हार्वेस्टर, चावल हार्वेस्टर, गेहूं हार्वेस्टर, मक्का हार्वेस्टर, गन्ना हार्वेस्टर, धान हार्वेस्टर
Marathi: कंबाइन हार्व्हेस्टर, तांदूळ हार्व्हेस्टर, गहू हार्व्हेस्टर, मका हार्व्हेस्टर, उसळ हार्व्हेस्टर, धान हार्व्हेस्टर
```

#### Companies (8 items)
```
English: John Deere, Claas, Mahindra, New Holland, AGCO, Preet, Sonalika, Other
Hindi: जॉन डीर, क्लास, महिंद्रा, न्यू हॉलैंड, एजीको, प्रीत, सोनालिका, अन्य
Marathi: जॉन डीर, क्लास, महिंद्रा, न्यू हॉलंड, एजीको, प्रीत, सोनालिका, इतर
```

#### Indian States (28 states)
- All need translation to Hindi and Marathi variants

#### Harvester Models (60+ models)
- Company names are already listed
- Model numbers generally remain same but should be in context

#### Filter Labels
```
Machine Type, Company, State, District, Available From, Available To, 
Price Range, Sort By, Search Operators, Search Harvesters, etc.
```

#### Status Labels
```
Active, Inactive, Pending, Confirmed, Completed, Cancelled, 
Requested, Approved, Rejected, etc.
```

### 5.2 Form Labels & Placeholders

#### Authentication Form
- Email/Username
- Password
- Confirm Password
- Full Name
- Phone Number
- District
- State
- Agree to Terms

#### Operator Listing Form
- Machine Type
- Company
- Model
- Year of Purchase
- Hours Used
- Availability
- Hourly Rate
- Description

#### Harvester Listing Form
(Similar to operator form)

#### Enquiry Form
- Enquiry Type
- Message
- Preferred Contact Method
- Available Dates

---

## Phase 6: Implementation Checklist

### Priority 1 (Critical)
- [ ] Create new JSON translation files (filters, status, placeholders, errors)
- [ ] Translate all 4 new files to Hindi and Marathi
- [ ] Update `i18n/config.ts` to include new namespaces
- [ ] Extract MACHINE_TYPES, COMPANIES, INDIAN_STATES to translation files
- [ ] Update Auth.tsx to use translations
- [ ] Update Pages.tsx to use translations for machine types and companies

### Priority 2 (High)
- [ ] Update Landing.tsx to use translations
- [ ] Update Dashboard.tsx to use translations
- [ ] Update form labels in shared components
- [ ] Translate all form placeholders
- [ ] Translate all button labels

### Priority 3 (Medium)
- [ ] Update Enquiry.tsx
- [ ] Update error messages and validation
- [ ] Update toast notifications
- [ ] Update empty state messages
- [ ] Update loading messages

### Priority 4 (Low)
- [ ] Update help text and tooltips
- [ ] Update user-facing comments
- [ ] Review and refine translated content

---

## Phase 7: Quality Assurance

### 7.1 Testing Checklist
- [ ] All pages load without errors in all 3 languages
- [ ] No untranslated strings visible in UI
- [ ] Machine types display correctly with each language
- [ ] Form validation messages are translated
- [ ] Error messages are translated
- [ ] Toast notifications are translated
- [ ] Empty states are translated
- [ ] Status labels are translated
- [ ] Filter options are translated

### 7.2 Content Review
- [ ] Native Hindi speaker reviews all Hindi translations
- [ ] Native Marathi speaker reviews all Marathi translations
- [ ] Verify technical terms are appropriately translated
- [ ] Check for consistency in terminology across all files
- [ ] Ensure formatting and special characters are correct

### 7.3 Performance Check
- [ ] Translation files load correctly
- [ ] No memory leaks from translation system
- [ ] Language switching is smooth
- [ ] No console errors related to i18n

---

## Phase 8: Maintenance Going Forward

### 8.1 Process for New Content
1. Always add new text to translation files first
2. Use `useTranslation()` hook in components
3. Never hardcode user-facing text
4. Add translations for all 3 languages simultaneously

### 8.2 Translation Naming Convention
```
Namespace/Feature: key/subkey/deeperkey
Format: camelCase for keys

Examples:
- filters.machineTypes.combineHarvester
- status.booking.pending
- placeholders.search
- errors.network.timeout
- messages.success.bookingCreated
```

### 8.3 Documentation
- Keep this plan updated as new sections are added
- Document any new translation namespaces created
- Maintain a glossary of common terms and their translations

---

## Summary Statistics

### Content Volume
- **Estimated strings to translate**: 300-400
- **High-priority items**: ~150
- **Medium-priority items**: ~100
- **Low-priority items**: ~50-150

### File Organization
- **New translation files**: 4
- **Total translation files**: 11 (7 existing + 4 new)
- **Languages**: 3 (English, Hindi, Marathi)
- **Total JSON files**: 33

### Effort Estimate
- **Phase 1 (Audit)**: 2-3 hours
- **Phase 2-3 (Planning & Extraction)**: 4-5 hours
- **Phase 4-5 (Implementation)**: 8-10 hours
- **Phase 6-7 (Refinement & QA)**: 6-8 hours
- **Total Estimated**: 20-26 hours

---

## Next Steps

1. Review and approve this plan
2. Gather translation resources (native speakers or translation service)
3. Create new JSON translation files
4. Extract hardcoded strings into translation files
5. Update component code to use translations
6. Conduct thorough testing
7. Deploy and monitor

---

**Created**: 2026-06-15
**Last Updated**: 2026-06-15
**Project**: IIM-Nagpur Tractor Seva
**Scope**: 100% Multilingual Coverage (EN, HI, MR)
