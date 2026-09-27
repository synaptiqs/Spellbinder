// ─────────────────────────────────────────────────────────────
//  SPELLBINDER — Firebase Project Configuration
//  Replace every value below with your own Firebase project keys.
//
//  How to get these:
//    1. Go to https://console.firebase.google.com
//    2. Create a project (or open an existing one)
//    3. Project Settings → General → Your apps → Add app → Web
//    4. Copy the firebaseConfig object Firebase generates
//    5. Paste the values below
//
//  Services to enable in Firebase Console:
//    • Authentication → Sign-in methods → Google  (enable)
//    • Authentication → Sign-in methods → Anonymous (enable)
//    • Firestore Database → Create database (Production mode)
//      then apply the security rules in deploy/firestore.rules
// ─────────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey:            "REPLACE_WITH_YOUR_API_KEY",
    authDomain:        "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
    projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket:     "REPLACE_WITH_YOUR_PROJECT.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId:             "REPLACE_WITH_YOUR_APP_ID",
};

export default firebaseConfig;
