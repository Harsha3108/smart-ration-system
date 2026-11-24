// Firebase Configuration for Smart Public Ration Distribution System
// Realtime Database URL: https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/

const firebaseConfig = {
  databaseURL: "https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "beneficiary-details-default",
  // Replace with your Web API Key from Firebase Console -> Project Settings if using Firebase Email/Password Auth
  apiKey: "AIzaSyDummyKeyForPublicRTDBRestAccess",
  authDomain: "beneficiary-details-default.firebaseapp.com",
  storageBucket: "beneficiary-details-default.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
  if (typeof firebase.auth === 'function') {
    window.auth = firebase.auth();
  }
  console.log("Firebase initialized (RTDB + Auth):", firebaseConfig.databaseURL);
} else {
  console.warn("Firebase SDK not loaded.");
}
