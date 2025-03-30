import { config } from "./config/config";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFirestore } from "./lib/firebase";

///////////////////////////////////////////////////////////////////////////////
// Validate environment variables
///////////////////////////////////////////////////////////////////////////////
function validateEnvironment() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Initialize Firebase and render the App component
///////////////////////////////////////////////////////////////////////////////
async function bootstrap() {
  try {
    // Validate environment variables first
    validateEnvironment();
    
    console.log("Initializing Firebase...");
    console.log("Firestore database ID:", config.firestore.databaseId);
    
    await initFirestore(config.firestore.databaseId);
    
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to initialize:", error);
    // You might want to show an error message to the user here
  }
}

bootstrap();
