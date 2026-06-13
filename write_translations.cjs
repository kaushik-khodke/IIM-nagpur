const fs = require('fs');
const path = require('path');

const en = {
  common: {
    "nav": {
      "home": "Home",
      "explore": "Explore",
      "messages": "Messages",
      "profile": "Profile",
      "logout": "Logout",
      "login": "Login",
      "register": "Register"
    },
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "submit": "Submit",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "search": "Search",
      "filter": "Filter",
      "clear": "Clear",
      "apply": "Apply",
      "close": "Close"
    },
    "common": {
      "yes": "Yes",
      "no": "No",
      "ok": "OK",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "info": "Info"
    },
    "language": {
      "english": "English",
      "hindi": "हिन्दी",
      "marathi": "मराठी",
      "selectLanguage": "Select Language"
    }
  },
  auth: {
    "login": {
      "title": "Login to Tractor Sewa",
      "email": "Email Address",
      "password": "Password",
      "rememberMe": "Remember Me",
      "forgotPassword": "Forgot Password?",
      "loginButton": "Login",
      "noAccount": "Don't have an account?",
      "registerLink": "Register here"
    },
    "register": {
      "title": "Create Your Account",
      "email": "Email Address",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "fullName": "Full Name",
      "phone": "Phone Number",
      "userType": "User Type",
      "state": "State",
      "district": "District",
      "registerButton": "Register",
      "haveAccount": "Already have an account?",
      "loginLink": "Login here",
      "agreeTerms": "I agree to the Terms and Conditions"
    },
    "userTypes": {
      "farmer": "Farmer",
      "operator": "Harvester Operator",
      "admin": "Admin"
    }
  },
  dashboard: {
    "sidebar": {
      "dashboard": "Dashboard",
      "profile": "My Profile",
      "requests": "Requests",
      "messages": "Messages",
      "blogs": "Blogs",
      "settings": "Settings",
      "admin": "Admin Portal"
    },
    "dashboard": {
      "welcome": "Welcome",
      "overview": "Overview",
      "activeRequests": "Active Requests",
      "completedRequests": "Completed Requests",
      "totalEarnings": "Total Earnings",
      "recentActivity": "Recent Activity"
    },
    "operators": {
      "title": "Harvester Operators",
      "filterByLocation": "Filter by Location",
      "noResults": "No operators found",
      "experience": "Experience",
      "rating": "Rating",
      "hireNow": "Hire Now",
      "viewProfile": "View Profile"
    },
    "harvesters": {
      "title": "Available Harvesters",
      "filterByType": "Filter by Type",
      "noResults": "No harvesters found",
      "capacity": "Capacity",
      "rentNow": "Rent Now"
    }
  },
  pages: {
    "landing": {
      "title": "Welcome to Tractor Sewa",
      "subtitle": "Connect with Farmers and Equipment Operators",
      "exploreOperators": "Explore Operators",
      "exploreHarvesters": "Explore Harvesters",
      "getStarted": "Get Started",
      "features": "Features",
      "testimonials": "What Our Users Say",
      "joinNow": "Join Now"
    },
    "profile": {
      "editProfile": "Edit Profile",
      "viewProfile": "View Profile",
      "myRequests": "My Requests",
      "myListings": "My Listings",
      "reviews": "Reviews",
      "completedJobs": "Completed Jobs"
    },
    "blogs": {
      "title": "Blogs & Articles",
      "latestArticles": "Latest Articles",
      "readMore": "Read More",
      "postedBy": "Posted by",
      "noBlogs": "No blogs available"
    }
  },
  messages: {
    "success": {
      "login": "Logged in successfully",
      "register": "Account created successfully",
      "profileUpdated": "Profile updated successfully",
      "requestCreated": "Request created successfully",
      "deleted": "Deleted successfully",
      "saved": "Saved successfully"
    },
    "error": {
      "login": "Invalid email or password",
      "register": "Registration failed",
      "emailExists": "Email already exists",
      "passwordMismatch": "Passwords do not match",
      "fillAllFields": "Please fill in all fields",
      "invalidEmail": "Invalid email address",
      "networkError": "Network error. Please try again",
      "serverError": "Server error. Please try again later"
    },
    "info": {
      "loading": "Loading...",
      "noData": "No data available",
      "confirmDelete": "Are you sure you want to delete this?"
    }
  },
  validation: {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "password": "Password must be at least 6 characters",
    "phone": "Please enter a valid phone number",
    "name": "Please enter a valid name",
    "match": "Fields do not match",
    "terms": "You must agree to the terms and conditions"
  },
  static: {
    "states": [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
      "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
      "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
      "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
      "West Bengal"
    ],
    "roles": {
      "farmer": "Farmer",
      "operator": "Harvester Operator",
      "admin": "Administrator"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected",
      "completed": "Completed"
    }
  }
};

const hi = {
  common: {
    "nav": {
      "home": "होम",
      "explore": "खोजें",
      "messages": "संदेश",
      "profile": "प्रोफाइल",
      "logout": "लॉगआउट",
      "login": "लॉगिन",
      "register": "पंजीकरण"
    },
    "buttons": {
      "save": "सहेजें",
      "cancel": "रद्द करें",
      "delete": "हटाएँ",
      "edit": "संपादित करें",
      "add": "जोड़ें",
      "submit": "जमा करें",
      "back": "पीछे",
      "next": "आगे",
      "previous": "पिछला",
      "search": "खोजें",
      "filter": "फ़िल्टर",
      "clear": "साफ़ करें",
      "apply": "लागू करें",
      "close": "बंद करें"
    },
    "common": {
      "yes": "हाँ",
      "no": "नहीं",
      "ok": "ठीक है",
      "loading": "लोड हो रहा है...",
      "error": "त्रुटि",
      "success": "सफल",
      "warning": "चेतावनी",
      "info": "जानकारी"
    },
    "language": {
      "english": "English",
      "hindi": "हिन्दी",
      "marathi": "मराठी",
      "selectLanguage": "भाषा चुनें"
    }
  },
  auth: {
    "login": {
      "title": "ट्रैक्टर सेवा में लॉगिन करें",
      "email": "ईमेल पता",
      "password": "पासवर्ड",
      "rememberMe": "मुझे याद रखें",
      "forgotPassword": "पासवर्ड भूल गए?",
      "loginButton": "लॉगिन",
      "noAccount": "खाता नहीं है?",
      "registerLink": "यहाँ पंजीकरण करें"
    },
    "register": {
      "title": "अपना खाता बनाएँ",
      "email": "ईमेल पता",
      "password": "पासवर्ड",
      "confirmPassword": "पासवर्ड की पुष्टि करें",
      "fullName": "पूरा नाम",
      "phone": "फोन नंबर",
      "userType": "उपयोगकर्ता प्रकार",
      "state": "राज्य",
      "district": "जिला",
      "registerButton": "पंजीकरण",
      "haveAccount": "पहले से खाता है?",
      "loginLink": "यहाँ लॉगिन करें",
      "agreeTerms": "मैं शर्तों और शर्तों से सहमत हूँ"
    },
    "userTypes": {
      "farmer": "किसान",
      "operator": "कटाई ऑपरेटर",
      "admin": "प्रशासक"
    }
  },
  dashboard: {
    "sidebar": {
      "dashboard": "डैशबोर्ड",
      "profile": "मेरी प्रोफाइल",
      "requests": "अनुरोध",
      "messages": "संदेश",
      "blogs": "ब्लॉग",
      "settings": "सेटिंग",
      "admin": "प्रशासन पोर्टल"
    },
    "dashboard": {
      "welcome": "स्वागत है",
      "overview": "अवलोकन",
      "activeRequests": "सक्रिय अनुरोध",
      "completedRequests": "पूर्ण अनुरोध",
      "totalEarnings": "कुल आय",
      "recentActivity": "हाल की गतिविधि"
    },
    "operators": {
      "title": "कटाई ऑपरेटर",
      "filterByLocation": "स्थान के आधार पर फ़िल्टर करें",
      "noResults": "कोई ऑपरेटर नहीं मिला",
      "experience": "अनुभव",
      "rating": "रेटिंग",
      "hireNow": "अभी किराए पर लें",
      "viewProfile": "प्रोफाइल देखें"
    },
    "harvesters": {
      "title": "उपलब्ध कटाई मशीनें",
      "filterByType": "प्रकार के आधार पर फ़िल्टर करें",
      "noResults": "कोई कटाई मशीन नहीं मिली",
      "capacity": "क्षमता",
      "rentNow": "अभी किराए पर लें"
    }
  },
  pages: {
    "landing": {
      "title": "ट्रैक्टर सेवा में आपका स्वागत है",
      "subtitle": "किसानों और उपकरण ऑपरेटरों के साथ जुड़ें",
      "exploreOperators": "ऑपरेटरों को खोजें",
      "exploreHarvesters": "कटाई मशीनों को खोजें",
      "getStarted": "शुरुआत करें",
      "features": "विशेषताएँ",
      "testimonials": "हमारे उपयोगकर्ता क्या कहते हैं",
      "joinNow": "अभी शामिल हों"
    },
    "profile": {
      "editProfile": "प्रोफाइल संपादित करें",
      "viewProfile": "प्रोफाइल देखें",
      "myRequests": "मेरे अनुरोध",
      "myListings": "मेरी सूची",
      "reviews": "समीक्षाएँ",
      "completedJobs": "पूर्ण किए गए काम"
    },
    "blogs": {
      "title": "ब्लॉग और लेख",
      "latestArticles": "नवीनतम लेख",
      "readMore": "और पढ़ें",
      "postedBy": "द्वारा पोस्ट किया गया",
      "noBlogs": "कोई ब्लॉग उपलब्ध नहीं"
    }
  },
  messages: {
    "success": {
      "login": "सफलतापूर्वक लॉगिन हुए",
      "register": "खाता सफलतापूर्वक बनाया गया",
      "profileUpdated": "प्रोफाइल सफलतापूर्वक अपडेट हुआ",
      "requestCreated": "अनुरोध सफलतापूर्वक बनाया गया",
      "deleted": "सफलतापूर्वक हटाया गया",
      "saved": "सफलतापूर्वक सहेजा गया"
    },
    "error": {
      "login": "गलत ईमेल या पासवर्ड",
      "register": "पंजीकरण विफल",
      "emailExists": "ईमेल पहले से मौजूद है",
      "passwordMismatch": "पासवर्ड मेल नहीं खाते",
      "fillAllFields": "कृपया सभी क्षेत्र भरें",
      "invalidEmail": "अमान्य ईमेल पता",
      "networkError": "नेटवर्क त्रुटि। फिर से कोशिश करें",
      "serverError": "सर्वर त्रुटि। बाद में कोशिश करें"
    },
    "info": {
      "loading": "लोड हो रहा है...",
      "noData": "कोई डेटा उपलब्ध नहीं",
      "confirmDelete": "क्या आप सुनिश्चित हैं कि आप इसे हटाना चाहते हैं?"
    }
  },
  validation: {
    "required": "यह क्षेत्र आवश्यक है",
    "email": "कृपया एक वैध ईमेल दर्ज करें",
    "password": "पासवर्ड कम से कम 6 वर्ण होना चाहिए",
    "phone": "कृपया एक वैध फोन नंबर दर्ज करें",
    "name": "कृपया एक वैध नाम दर्ज करें",
    "match": "क्षेत्र मेल नहीं खाते",
    "terms": "आपको शर्तों और शर्तों से सहमत होना चाहिए"
  },
  static: {
    "states": [
      "आंध्र प्रदेश", "अरुणाचल प्रदेश", "असम", "बिहार", "छत्तीसगढ़",
      "गोवा", "गुजरात", "हरियाणा", "हिमाचल प्रदेश", "झारखंड", "कर्नाटक",
      "केरल", "मध्य प्रदेश", "महाराष्ट्र", "मणिपुर", "मेघालय",
      "मिजोरम", "नागालैंड", "ओडिशा", "पंजाब", "राजस्थान", "सिक्किम",
      "तमिलनाडु", "तेलंगाना", "त्रिपुरा", "उत्तर प्रदेश", "उत्तराखंड",
      "पश्चिम बंगाल"
    ],
    "roles": {
      "farmer": "किसान",
      "operator": "कटाई ऑपरेटर",
      "admin": "व्यवस्थापक"
    },
    "status": {
      "active": "सक्रिय",
      "inactive": "निष्क्रिय",
      "pending": "लंबित",
      "approved": "मंजूर",
      "rejected": "अस्वीकृत",
      "completed": "पूर्ण"
    }
  }
};

const mr = {
  common: {
    "nav": {
      "home": "होम",
      "explore": "एक्सप्लोर करा",
      "messages": "संदेश",
      "profile": "प्रोफाइल",
      "logout": "लॉगआउट",
      "login": "लॉगिन",
      "register": "नोंदणी"
    },
    "buttons": {
      "save": "जतन करा",
      "cancel": "रद्द करा",
      "delete": "हटवा",
      "edit": "संपादन करा",
      "add": "जोडा",
      "submit": "सादर करा",
      "back": "मागे",
      "next": "पुढे",
      "previous": "मागील",
      "search": "शोध",
      "filter": "फिल्टर",
      "clear": "साफ करा",
      "apply": "लागू करा",
      "close": "बंद करा"
    },
    "common": {
      "yes": "हो",
      "no": "नाही",
      "ok": "ठीक आहे",
      "loading": "लोड होत आहे...",
      "error": "त्रुटी",
      "success": "यशस्वी",
      "warning": "चेतावणी",
      "info": "माहिती"
    },
    "language": {
      "english": "English",
      "hindi": "हिन्दी",
      "marathi": "मराठी",
      "selectLanguage": "भाषा निवडा"
    }
  },
  auth: {
    "login": {
      "title": "ट्रॅक्टर सेवा मध्ये लॉगिन करा",
      "email": "ईमेल पत्ता",
      "password": "पासवर्ड",
      "rememberMe": "मला लक्षात ठेवा",
      "forgotPassword": "पासवर्ड विसरलात?",
      "loginButton": "लॉगिन",
      "noAccount": "खाते नाही?",
      "registerLink": "येथे नोंदणी करा"
    },
    "register": {
      "title": "आपला खाता तयार करा",
      "email": "ईमेल पत्ता",
      "password": "पासवर्ड",
      "confirmPassword": "पासवर्डची पुष्टी करा",
      "fullName": "पूर्ण नाव",
      "phone": "फोन नंबर",
      "userType": "वापरकर्त्याचा प्रकार",
      "state": "राज्य",
      "district": "जिल्हा",
      "registerButton": "नोंदणी",
      "haveAccount": "आधीच खाता आहे?",
      "loginLink": "येथे लॉगिन करा",
      "agreeTerms": "मी अटी आणि शर्तींशी सहमत आहे"
    },
    "userTypes": {
      "farmer": "शेतकरी",
      "operator": "कटणी ऑपरेटर",
      "admin": "प्रशासक"
    }
  },
  dashboard: {
    "sidebar": {
      "dashboard": "डॅशबोर्ड",
      "profile": "माझी प्रोफाइल",
      "requests": "विनंत्या",
      "messages": "संदेश",
      "blogs": "ब्लॉग",
      "settings": "सेटिंग्ज",
      "admin": "प्रशासन पोर्टल"
    },
    "dashboard": {
      "welcome": "स्वागत आहे",
      "overview": "अवलोकन",
      "activeRequests": "सक्रिय विनंत्या",
      "completedRequests": "पूर्ण केलेल्या विनंत्या",
      "totalEarnings": "एकूण कमाई",
      "recentActivity": "अलीकडील क्रियाकलाप"
    },
    "operators": {
      "title": "कटणी ऑपरेटर",
      "filterByLocation": "स्थानानुसार फिल्टर करा",
      "noResults": "कोणते ऑपरेटर मिळाले नाही",
      "experience": "अनुभव",
      "rating": "रेटिंग",
      "hireNow": "आता भाडे घ्या",
      "viewProfile": "प्रोफाइल पहा"
    },
    "harvesters": {
      "title": "उपलब्ध कटणी मशीन",
      "filterByType": "प्रकारानुसार फिल्टर करा",
      "noResults": "कोणती कटणी मशीन मिळाली नाही",
      "capacity": "क्षमता",
      "rentNow": "आता भाडे घ्या"
    }
  },
  pages: {
    "landing": {
      "title": "ट्रॅक्टर सेवा मध्ये स्वागत आहे",
      "subtitle": "शेतकरी आणि उपकरण ऑपरेटरांशी जोडला जा",
      "exploreOperators": "ऑपरेटर शोध",
      "exploreHarvesters": "कटणी मशीन शोध",
      "getStarted": "सुरू करा",
      "features": "वैशिष्ट्ये",
      "testimonials": "आमचे वापरकर्ते काय म्हणतात",
      "joinNow": "आता सामील व्हा"
    },
    "profile": {
      "editProfile": "प्रोफाइल संपादन करा",
      "viewProfile": "प्रोफाइल पहा",
      "myRequests": "माझ्या विनंत्या",
      "myListings": "माझ्या यादी",
      "reviews": "मत",
      "completedJobs": "पूर्ण केलेल्या कामे"
    },
    "blogs": {
      "title": "ब्लॉग आणि लेख",
      "latestArticles": "सर्वात नवीन लेख",
      "readMore": "अधिक वाचा",
      "postedBy": "द्वारे पोस्ट केलेले",
      "noBlogs": "कोणतेही ब्लॉग उपलब्ध नाहीत"
    }
  },
  messages: {
    "success": {
      "login": "यशस्वीरित्या लॉगिन केले",
      "register": "खाता यशस्वीरित्या तयार केला",
      "profileUpdated": "प्रोफाइल यशस्वीरित्या अपडेट केला",
      "requestCreated": "विनंती यशस्वीरित्या तयार केली",
      "deleted": "यशस्वीरित्या हटवले",
      "saved": "यशस्वीरित्या जतन केले"
    },
    "error": {
      "login": "गलत ईमेल किंवा पासवर्ड",
      "register": "नोंदणी अयशस्वी",
      "emailExists": "ईमेल आधीच अस्तित्वात आहे",
      "passwordMismatch": "पासवर्ड जुळत नाहीत",
      "fillAllFields": "कृपया सर्व क्षेत्र भरा",
      "invalidEmail": "अमान्य ईमेल पत्ता",
      "networkError": "नेटवर्क त्रुटी. पुन्हा प्रयत्न करा",
      "serverError": "सर्व्हर त्रुटी. नंतर पुन्हा प्रयत्न करा"
    },
    "info": {
      "loading": "लोड होत आहे...",
      "noData": "कोणताही डेटा उपलब्ध नाही",
      "confirmDelete": "तुम्हाला हे हटवायचे आहे का?"
    }
  },
  validation: {
    "required": "हे क्षेत्र आवश्यक आहे",
    "email": "कृपया एक वैध ईमेल प्रविष्ट करा",
    "password": "पासवर्ड किमान 6 वर्ण असणे आवश्यक आहे",
    "phone": "कृपया एक वैध फोन नंबर प्रविष्ट करा",
    "name": "कृपया एक वैध नाव प्रविष्ट करा",
    "match": "क्षेत्र जुळत नाहीत",
    "terms": "तुम्हाला अटी आणि शर्तींशी सहमत होणे आवश्यक आहे"
  },
  static: {
    "states": [
      "आंध्र प्रदेश", "अरुणाचल प्रदेश", "असम", "बिहार", "छत्तीसगढ",
      "गोवा", "गुजरात", "हरियाणा", "हिमाचल प्रदेश", "झारखंड", "कर्नाटक",
      "केरळ", "मध्य प्रदेश", "महाराष्ट्र", "मणिपूर", "मेघालय",
      "मिजोरम", "नागालँड", "उड़ीसा", "पंजाब", "राजस्थान", "सिक्किम",
      "तमिळनाडु", "तेलंगणा", "त्रिपुरा", "उत्तर प्रदेश", "उत्तरांचल",
      "पश्चिम बंगाल"
    ],
    "roles": {
      "farmer": "शेतकरी",
      "operator": "कटणी ऑपरेटर",
      "admin": "प्रशासक"
    },
    "status": {
      "active": "सक्रिय",
      "inactive": "निष्क्रिय",
      "pending": "प्रलंबित",
      "approved": "मंजूर",
      "rejected": "नाकारले",
      "completed": "पूर्ण"
    }
  }
};

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const data = { en, hi, mr };

Object.keys(data).forEach(lang => {
  Object.keys(data[lang]).forEach(file => {
    fs.writeFileSync(
      path.join(localesDir, lang, `${file}.json`),
      JSON.stringify(data[lang][file], null, 2)
    );
  });
});

console.log('All 21 translation files written successfully!');
