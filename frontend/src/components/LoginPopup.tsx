/**
 * LoginPopup — Simple modal for login.
 * Only renders when showLoginPopup is true. Nothing in DOM when closed.
 */
import { useState, useEffect, useRef } from "react";
import { X, Phone, ArrowRight, Loader2, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const LoginPopup = () => {
  const { user, showLoginPopup, setShowLoginPopup, sendPhoneOTP, verifyPhoneOTP, loginWithGoogle } = useAuth();

  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneAuthAvailable, setPhoneAuthAvailable] = useState(true);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Trigger from ProtectedRoute redirects
  useEffect(() => {
    const locState = location.state as { triggerLoginPopup?: boolean; from?: any } | null;
    if (locState?.triggerLoginPopup && !user) {
      setShowLoginPopup(true);
      // Clean up the state so refreshing doesn't pop it again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user, setShowLoginPopup]);

  // Reset on open
  useEffect(() => {
    if (showLoginPopup) { setStep("phone"); setPhone(""); setOtp(["", "", "", "", "", ""]); setError(null); }
  }, [showLoginPopup]);

  const close = () => setShowLoginPopup(false);

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 10) { setError("Please enter a valid 10-digit mobile number."); return; }
    const fullNumber = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
    setSending(true); setError(null);
    try {
      await sendPhoneOTP(fullNumber, "recaptcha-container");
      setStep("otp");
      toast.success("OTP sent!");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("too-many-requests")) setError("Too many attempts. Try again later.");
      else { setPhoneAuthAvailable(false); setError("Phone login not available. Use Google instead."); }
    } finally { setSending(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (value && index === 5 && newOtp.every(d => d)) handleVerifyOTP(newOtp.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setVerifying(true); setError(null);
    try {
      await verifyPhoneOTP(otpCode);
      setStep("success");
      toast.success("Verified!");
      setTimeout(close, 1500);
    } catch {
      setError("Wrong OTP. Try again.");
      setOtp(["", "", "", "", "", ""]); otpRefs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      toast.success("Logged in!");
      close();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    }
  };

  // NOTHING in DOM when popup is closed — zero interference
  if (!showLoginPopup) return null;

  return (
    <div className="fixed inset-0 z-[9000]">
      {/* reCAPTCHA container — hidden */}
      <div id="recaptcha-container" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0, pointerEvents: "none" }} />

      {/* Backdrop — clicking dismisses */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      {/* Center modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>

          {/* Close */}
          <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors z-10">
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 pt-8 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {step === "phone" ? "Get Started" : step === "otp" ? "Verify OTP" : "Welcome!"}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {step === "phone" ? "Sign in to access all features" : step === "otp" ? `Code sent to +91 ${phone.replace(/\s/g, "").slice(-10)}` : "You're all set!"}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium text-center flex items-center gap-2 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {step === "phone" && (
              <div className="space-y-4">
                {/* Google — primary */}
                <button onClick={handleGoogleLogin} className="w-full h-12 rounded-xl bg-white border-2 border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center justify-center gap-3 shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3"><div className="h-px bg-stone-200 flex-1" /><span className="text-xs text-stone-400">or use phone</span><div className="h-px bg-stone-200 flex-1" /></div>

                {phoneAuthAvailable ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1.5 block">Mobile Number</label>
                      <div className="flex gap-2">
                        <div className="w-16 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-sm font-bold text-stone-600">+91</div>
                        <Input type="tel" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                          className="flex-1 h-12 rounded-xl bg-white border-stone-300 text-stone-800 focus-visible:ring-orange-500 text-base font-medium" maxLength={12} autoFocus />
                      </div>
                    </div>
                    <Button onClick={handleSendOTP} disabled={sending || phone.replace(/\s/g, "").length < 10}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-400/25 border-0 group disabled:opacity-50">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : <>Send OTP <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                    </Button>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                    <p className="text-sm text-amber-700 font-medium">Phone login coming soon.</p>
                    <p className="text-xs text-amber-600 mt-1">Use Google to sign in for now.</p>
                  </div>
                )}

                <p className="text-center text-[11px] text-stone-400">By continuing, you agree to our Terms & Privacy Policy</p>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-3 block text-center">Enter 6-digit code</label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${digit ? "border-orange-400 bg-orange-50 text-stone-800" : "border-stone-200 bg-stone-50"} focus:border-orange-500 focus:bg-orange-50`} />
                    ))}
                  </div>
                </div>
                <Button onClick={() => handleVerifyOTP()} disabled={verifying || otp.some(d => !d)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg border-0 disabled:opacity-50">
                  {verifying ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</> : "Verify & Continue"}
                </Button>
                <div className="text-center">
                  <button onClick={() => setStep("phone")} className="text-sm text-orange-600 font-semibold">Change number</button>
                  <span className="mx-2 text-stone-300">|</span>
                  <button onClick={handleSendOTP} className="text-sm text-stone-500 font-medium">Resend</button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-stone-800 mb-1">You're in!</h3>
                <p className="text-sm text-stone-500">Redirecting...</p>
              </div>
            )}
          </div>

          {step !== "success" && (
            <div className="px-8 pb-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400"><Shield className="w-3 h-3" /> Secure</div>
              <div className="w-1 h-1 rounded-full bg-stone-300" />
              <div className="text-[11px] text-stone-400">Free to start</div>
              <div className="w-1 h-1 rounded-full bg-stone-300" />
              <div className="text-[11px] text-stone-400">No spam</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPopup;
