// Powered by OnSpace.AI
// Firestore Security Rules — deploy these in Firebase Console → Firestore → Rules
// 
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//
//     // Only the admin email can write to any collection
//     function isAdmin() {
//       return request.auth != null &&
//              request.auth.token.email == 'engsayedezzat@gmail.com';
//     }
//
//     // Any authenticated user can read public artwork fields
//     function isAuthenticated() {
//       return request.auth != null;
//     }
//
//     // Public artworks — anyone can read (for client mode)
//     match /artworks/{docId} {
//       allow read: if true;
//       allow write: if isAdmin();
//     }
//
//     // Private data — admin only
//     match /materials/{docId}       { allow read, write: if isAdmin(); }
//     match /suppliers/{docId}       { allow read, write: if isAdmin(); }
//     match /customers/{docId}       { allow read, write: if isAdmin(); }
//     match /quotes/{docId}          { allow read, write: if isAdmin(); }
//     match /categories/{docId}      { allow read: if true; allow write: if isAdmin(); }
//     match /artworkCosts/{docId}    { allow read, write: if isAdmin(); }
//     match /workers/{docId}         { allow read, write: if isAdmin(); }
//     match /productionOrders/{docId} { allow read, write: if isAdmin(); }
//     match /internalManufacturing/{docId} { allow read, write: if isAdmin(); }
//     match /externalManufacturing/{docId} { allow read, write: if isAdmin(); }
//     match /settings/{docId}        { allow read, write: if isAdmin(); }
//
//     // Deny everything else
//     match /{document=**} {
//       allow read, write: if false;
//     }
//   }
// }
//
// HOW TO DEPLOY:
// 1. Open https://console.firebase.google.com/project/sayed-gallery/firestore/rules
// 2. Copy the rules above (without the // comment markers)
// 3. Click "Publish"
//
// IMPORTANT: Until you deploy these rules, Firestore uses default rules.
// Deploy these rules to protect your data properly.

export const FIRESTORE_RULES_REMINDER = `
Deploy Firestore Security Rules from services/firestoreRules.ts
to protect admin-only data.
`;
