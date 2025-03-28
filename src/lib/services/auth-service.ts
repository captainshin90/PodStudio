import { 
  Auth,  
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  User,
  UserCredential,
  onAuthStateChanged
} from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { initFirestore, initAuth, googleProvider, facebookProvider, microsoftProvider } from "@/lib/firebase";
import { usersService } from "./database-service";
import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";

export type AuthProviderType = 'google' | 'facebook' | 'microsoft';
export type AuthMethod = 'popup' | 'redirect';

///////////////////////////////////////////////////////////////////////////////
// AuthService class
///////////////////////////////////////////////////////////////////////////////
export class AuthService {
  private static instance: AuthService;
  public db: Firestore | undefined;
  public auth: Auth | undefined;
  public currentUser: User | null = null;
  private initialized: boolean = false;

  constructor() {
    this.init();    
  } 

  private async init() {
    if (this.initialized) {
      return;
    }

    try {
      this.auth = await initAuth();
      this.db = await initFirestore();
      
      if (this.auth) {
        this.currentUser = this.auth.currentUser;
        this.initialized = true;
        console.log("Firebase services initialized successfully");
      }
    } catch (error) {
      console.error("Firestore or Auth initialization error:", error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // singleton class to hold global state
  ///////////////////////////////////////////////////////////////////////////////
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Get the current user
  ///////////////////////////////////////////////////////////////////////////////
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Sign up with email and password
  ///////////////////////////////////////////////////////////////////////////////
  async signUpWithEmail(email: string, password: string, userData: any): Promise<UserCredential> {

    console.log("Attempting to create user with email:", email);
        
    if (this.db && this.auth) {
      try {     
        // Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        console.log("User created successfully:", userCredential.user.uid);
        
        // Create the user profile in Firestore
        await usersService.createUser(userCredential.user.uid, {
          login_id: email,
          email1: email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          subscription_type: 'free', // Default subscription
          ...userData
        });
        console.log("User profile created in Firestore");
        
        return userCredential;
      } catch (error) {
        console.error("Error in signUpWithEmail:", error);
        throw error;
      }
    } else {
      return Promise.reject(new Error("Firebase Auth is not initialized."));
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Sign in with email and password
  ///////////////////////////////////////////////////////////////////////////////
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      if (!this.auth) { 
        return Promise.reject(new Error("Firebase Auth is not initialized."));
      }

      console.log("Attempting to sign in with email:", email);
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      console.log("Email sign in successful:", result.user.uid);
      return result;
    } catch (error) {
      console.error("Error in signInWithEmail:", error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Sign in with a social provider
  ///////////////////////////////////////////////////////////////////////////////
  async signInWithProvider(providerName: AuthProviderType, method: AuthMethod = 'popup'): Promise<UserCredential | void> {
    // Ensure initialization
    await this.init();
    
    if (!this.auth) {
      return Promise.reject(new Error("Firebase Auth is not initialized."));
    }

    let provider;
    try {
      // Get the provider instance
      switch (providerName) {
        case 'google':
          provider = googleProvider;
          if (!(provider instanceof GoogleAuthProvider)) {
            throw new Error('Google provider not properly initialized');
          }
          break;
        case 'facebook':
          provider = facebookProvider;
          if (!(provider instanceof FacebookAuthProvider)) {
            throw new Error('Facebook provider not properly initialized');
          }
          break;
        case 'microsoft':
          provider = microsoftProvider;
          if (!(provider instanceof OAuthProvider)) {
            throw new Error('Microsoft provider not properly initialized');
          }
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
    
      console.log(`Attempting to sign in with ${providerName} using ${method} method`);
        
      // Sign in with the provider using the specified method
      let userCredential;
      
      if (method === 'popup') {
        userCredential = await signInWithPopup(this.auth, provider);
        console.log(`${providerName} popup sign in successful:`, userCredential.user.uid);
      } else {
        // For redirect method, we initiate the redirect and don't get a result immediately
        console.log(`Redirecting to ${providerName} sign in page...`);
        await signInWithRedirect(this.auth, provider);
        return; // The function will return here, and the page will redirect
      }
      
      // Check if the user exists in Firestore
      const userDoc = await usersService.getUserById(userCredential.user.uid);

      // If the user doesn't exist, create a profile
      if (!userDoc) {
        console.log("User doesn't exist in Firestore, creating profile...");
        const user = userCredential.user;
        await usersService.createUser(user.uid, {
          login_id: user.email,
          email1: user.email,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
          avatar: user.photoURL,
          subscription_type: 'free' // Default subscription
        });
        console.log("User profile created in Firestore");
      }
      
      return userCredential;
    } catch (error) {
      console.error(`Error in signInWithProvider (${providerName}):`, error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Get the result of a redirect sign-in
  ///////////////////////////////////////////////////////////////////////////////
  async getRedirectResult(): Promise<UserCredential | null> {
    try {
      console.log("Getting redirect result...");

      if (!this.db || !this.auth) { 
        return Promise.reject(new Error("Firebase Auth is not initialized."));
      }
      else {
        const result = await getRedirectResult(this.auth);
        if (result) {
          console.log("Redirect sign in successful:", result.user.uid);          
        
          // Check if the user exists in Firestore
          const userDoc = await usersService.getUserById(result.user.uid);
        
          // If the user doesn't exist, create a profile
          if (!userDoc) {
            console.log("User doesn't exist in Firestore, creating profile...");
            const user = result.user;
            await usersService.createUser(user.uid, {
              login_id: user.email,
              email1: user.email,
              first_name: user.displayName?.split(' ')[0] || '',
              last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
              avatar: user.photoURL,
              subscription_type: 'free' // Default subscription
            });
            console.log("User profile created in Firestore");
          }
          return result;  
        }
        else {
          console.log("No redirect result");
          return null;
        }
      }
    } catch (error) {
      console.error('Error in getRedirectResult:', error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Sign out
  ///////////////////////////////////////////////////////////////////////////////
  async signOut(): Promise<void> {
    try {
      if (!this.auth) { 
        return Promise.reject(new Error("Firebase Auth is not initialized."));
      }

      console.log("Attempting to sign out user");
      await signOut(this.auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Reset password
  ///////////////////////////////////////////////////////////////////////////////
  async resetPassword(email: string): Promise<void> {
    try {
      if (!this.auth) { 
        return Promise.reject(new Error("Firebase Auth is not initialized."));
      }

      console.log("Sending password reset email to:", email);
      await sendPasswordResetEmail(this.auth, email);
      console.log("Password reset email sent successfully");
    } catch (error) {
      console.error("Error in resetPassword:", error);
      throw error;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Subscribe to auth state changes
  ///////////////////////////////////////////////////////////////////////////////
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    
    if (!this.auth || this.auth === undefined) {
      console.log("Firebase Auth is not initialized.");
      return () => {}; // Return a no-op function
    }
    return onAuthStateChanged(this.auth as Auth, callback);
  }
}

///////////////////////////////////////////////////////////////////////////////
// create singleton object
///////////////////////////////////////////////////////////////////////////////
export let authService = AuthService.getInstance();