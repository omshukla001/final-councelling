import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/LayoutAtoms";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const { signupWithEmail, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await signupWithEmail(email, password); setSignupSuccess(true); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.includes("email-already-in-use")) setError("This email is already registered.");
      else if (msg.includes("weak-password")) setError("Password must be at least 6 characters.");
      else setError(msg);
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    try { await loginWithGoogle(); toast.success("Account created successfully."); navigate("/"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Registration failed"); }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 pt-24 pb-6 bg-[#f0ece4]">
        <div className="w-full max-w-sm">
          <FadeIn>
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
              <h2 className="text-2xl font-extrabold mb-3 text-emerald-700">Account Created!</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">We've sent a verification link to<br /><span className="text-stone-800 font-semibold mt-1 block">{email}</span></p>
              <Link to="/login" className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center group">
                Go to Login <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left: Photo */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900/75 via-stone-800/60 to-stone-700/50" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8 text-white" /></div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Join CounsellorWala</h2>
            <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">Get instant access to college predictions, AI counselling, and 10 years of JoSAA data.</p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#f0ece4]">
        <div className="w-full max-w-sm">
          <FadeIn>
            <div className="text-center mb-8">
              <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 mb-5"><Sparkles className="w-7 h-7 text-orange-600" /></div>
              <h1 className="text-3xl font-extrabold tracking-tight text-stone-800 mb-2">Create <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">Account</span></h1>
              <p className="text-sm text-stone-500">Join CounsellorWala and start exploring</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-white border border-stone-200 rounded-2xl p-7 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-600 text-center">{error}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 pl-1 mb-1.5 block">Email</label>
                    <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl bg-white border-stone-300 text-stone-800 focus-visible:ring-orange-500 text-sm" required /></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center pl-1 mb-1.5"><label className="text-xs font-semibold text-stone-500">Password</label><span className="text-xs text-stone-400">Min 6 characters</span></div>
                    <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input type={showPassword ? "text" : "password"} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-xl bg-white border-stone-300 text-stone-800 focus-visible:ring-orange-500 text-sm" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-lg shadow-orange-500/20 border-0">
                  {loading ? "Creating account..." : "Create Account"}{!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
                <div className="flex items-center gap-3"><div className="h-px bg-stone-200 flex-1" /><span className="text-xs text-stone-400 font-medium">or</span><div className="h-px bg-stone-200 flex-1" /></div>
                <button type="button" onClick={handleGoogleSignup} className="w-full h-12 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Continue with Google
                </button>
              </form>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}><p className="text-center text-sm text-stone-500 mt-6">Already have an account?{" "}<Link to="/login" className="text-orange-600 hover:text-orange-500 font-semibold transition-colors">Log in</Link></p></FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Signup;
