/////////////////////////////////////////////////////////////////////////////
// This is the client side initialization of Firebase Auth and Firestore
/////////////////////////////////////////////////////////////////////////////

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import config from "../server/config";


// Validate required configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Initialize Firebase objects
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Create providers as constants instead of variables
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

// Configure providers with additional OAuth scopes and custom parameters
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  login_hint: ''
});

//////////////////////////////////////////////////////////////// 
// This is the client side initialization of Firebase Auth 
////////////////////////////////////////////////////////////////
export async function initAuth() : Promise<Auth> {
  if (!getApps().length) {
    try {
      // Validate config before initialization
      if (!config.firebase.apiKey || !config.firebase.authDomain) {
      //  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
          throw new Error('Missing required Firebase configuration. Check your environment variables.');
      }

      // Use config.firebase from server/config.js
      //      app = initializeApp(firebaseConfig); 
      app = initializeApp(config.firebase); 
      console.log("Firebase app initialized successfully");
    } catch (error) {
      console.error("Firebase app initialization error:", error);
      throw error;
    }
  } else {
    app = getApps()[0];
    console.log("Firebase app already initialized");
  }
 
  auth = getAuth(app);
  return auth;
}


//////////////////////////////////////////////////////////////// 
// This is the client side initialization of Firestore
////////////////////////////////////////////////////////////////
export async function initFirestore(databaseId: string = "") : Promise<Firestore> {
  let dbstr: string = "";

  if (!getApps().length) {
    try {
      // Use config.firebase from server/config.js
      // console.log('Firebase databaseId=' + process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID);
      // app = initializeApp(firebaseConfig);      
      app = initializeApp(config.firebase); 
      console.log("Firebase app initialized successfully");
      // console.log("Firebase config=" + JSON.stringify(config.firebase));
    } catch (error) {
      console.error("Firebase app initialization error:", error);
    }
  } else {
    app = getApps()[0];
    console.log("Firebase app already initialized");
  }

  if (config.firestore.databaseId != undefined) 
    dbstr = config.firestore.databaseId;  // database from .env
  else
    dbstr = databaseId;   // database passed as argument

  try {
    // Check if Firestore is already initialized
    if (!db) {
      // Initialize Firestore with persistence settings only if not already initialized
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, dbstr);
      console.log("Firestore database initialized with persistence: ", dbstr);
    } else {
      // Use existing Firestore instance
      db = getFirestore(app, dbstr);
      console.log("Using existing Firestore instance: ", dbstr);
    }
  } catch (error) {
    console.error("Firestore database error:", error);
  }

  return db;
}


/////////////////////////////////////////////////////////////////////////////
// Export the Firebase objects
/////////////////////////////////////////////////////////////////////////////
export { 
  app, 
  auth, 
  db, 
//  firebaseConfig, 
//  firestoreConfig, 
  googleProvider, 
  facebookProvider, 
  microsoftProvider 
};


// To add App Check (recaptcha) to your app, import the following functions
/***** Firebase App Check *****
import { initializeApp } from "firebase/app";
import { getAppCheck, getToken } from "firebase/app-check";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "four-freedoms-451318", //Your Project ID
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check.  Replace "recaptcha" with your chosen provider if needed.
const appCheck = getAppCheck(app);

// Example of getting an App Check token (replace 'YOUR_BACKEND_ENDPOINT' with the actual URL.)
async function getAndUseToken(){
    try {
        const token = await getToken(appCheck);
        //Send this token to your backend along with other request parameters
        const response = await fetch('YOUR_BACKEND_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Firebase-AppCheck': token //Add the token to the request header
            },
            body: JSON.stringify({data: 'your data here'})
        });
        const data = await response.json();
        console.log(data);
    } catch (error){
        console.error("Error getting token or sending request:", error);
    }
}

getAndUseToken();
******/