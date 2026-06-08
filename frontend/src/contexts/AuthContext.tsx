import { createContext, useContext, type ReactNode } from "react";

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
  firebaseUser: null;
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

const GUEST_USER: AuthUser = {
  id: "guest",
  email: null,
  displayName: "Guest",
  photoURL: null,
  emailVerified: true,
  phoneNumber: null,
};

const noop = async () => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: GUEST_USER,
      firebaseUser: null,
      loading: false,
      showLoginPopup: false,
      setShowLoginPopup: () => {},
      loginWithEmail: noop,
      signupWithEmail: noop,
      loginWithGoogle: noop,
      sendPhoneOTP: noop,
      verifyPhoneOTP: noop,
      logout: noop,
      resendVerificationEmail: noop,
      requireAuth: () => true,
    }}>
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
