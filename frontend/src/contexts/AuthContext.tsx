/**
 * AuthContext — Firebase-powered global auth state.
 * Supports: Phone OTP, Email/Password, Google OAuth.
 * Shows login popup instead of redirecting to /login.
 */
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    PhoneAuthProvider,
    signInWithCredential,
    type User as FirebaseUser,
    type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface AuthUser {
    id: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    showLoginPopup: boolean;
    setShowLoginPopup: (show: boolean) => void;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    sendPhoneOTP: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
    verifyPhoneOTP: (otp: string) => Promise<void>;
    logout: () => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(fbUser: FirebaseUser): AuthUser {
    return {
        id: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        emailVerified: fbUser.emailVerified,
        phoneNumber: fbUser.phoneNumber,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
            if (fbUser && (fbUser.emailVerified || fbUser.phoneNumber)) {
                setFirebaseUser(fbUser);
                setUser(mapFirebaseUser(fbUser));
                setShowLoginPopup(false);
            } else if (fbUser && !fbUser.emailVerified && !fbUser.phoneNumber) {
                setFirebaseUser(fbUser);
                setUser(null);
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const loginWithEmail = useCallback(async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
            await sendEmailVerification(cred.user);
            await signOut(auth);
            throw new Error("Your email is not verified yet. We've sent a new verification link.");
        }
    }, []);

    const signupWithEmail = useCallback(async (email: string, password: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await signOut(auth);
    }, []);

    const loginWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    }, []);

    const sendPhoneOTP = useCallback(async (phoneNumber: string, recaptchaContainerId: string) => {
        // Clean up previous verifier
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
        }
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
            size: "invisible",
            callback: () => {},
        });
        setRecaptchaVerifier(verifier);
        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
    }, [recaptchaVerifier]);

    const verifyPhoneOTP = useCallback(async (otp: string) => {
        if (!confirmationResult) throw new Error("Please request OTP first.");
        await confirmationResult.confirm(otp);
    }, [confirmationResult]);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const resendVerificationEmail = useCallback(async () => {
        if (auth.currentUser && !auth.currentUser.emailVerified) {
            await sendEmailVerification(auth.currentUser);
        }
    }, []);

    // Call this from any page when auth is needed — opens popup instead of redirecting
    const requireAuth = useCallback(() => {
        if (user) return true;
        setShowLoginPopup(true);
        return false;
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                showLoginPopup,
                setShowLoginPopup,
                loginWithEmail,
                signupWithEmail,
                loginWithGoogle,
                sendPhoneOTP,
                verifyPhoneOTP,
                logout,
                resendVerificationEmail,
                requireAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export default AuthContext;
