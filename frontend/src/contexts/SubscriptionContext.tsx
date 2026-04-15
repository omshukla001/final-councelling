import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useRazorpay } from "react-razorpay";
import { toast } from "sonner";
import api from "@/services/api";

interface SubscriptionContextType {
  isPremium: boolean;
  aiMessageCount: number;
  triggerPaymentFlow: () => Promise<void>;
  updateAiMessageCount: () => Promise<void>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { Razorpay } = useRazorpay();
  const [isPremium, setIsPremium] = useState(false);
  const [aiMessageCount, setAiMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync user status on authentication
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.id) {
        setIsPremium(false);
        setAiMessageCount(0);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data } = await api.post("/user/sync", {
          firebase_uid: user.id,
          email: user.email || "",
          name: user.displayName || "User"
        });
        
        setIsPremium(data.is_premium || false);
        setAiMessageCount(data.ai_message_count || 0);
      } catch (err) {
        console.error("Failed to sync user status", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [user]);

  const updateAiMessageCount = async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.post("/user/sync", {
        firebase_uid: user.id,
        email: user.email || "",
        name: user.displayName || "User"
      });
      setAiMessageCount(data.ai_message_count || 0);
      setIsPremium(data.is_premium || false);
    } catch(err) {
      console.error(err);
    }
  };

  const triggerPaymentFlow = async () => {
    if (!user?.id) {
      toast.error("Please log in to upgrade.");
      return;
    }

    try {
      toast.loading("Initiating secure payment...");
      
      // 1. Create order on backend (api instance auto-attaches Bearer token)
      const { data: order } = await api.post("/payments/create-order", {
        firebase_uid: user.id,
        amount: 9900
      });
      
      toast.dismiss();

      // 2. Open Razorpay Interface
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "YOUR_TEST_KEY_HERE", 
        amount: order.amount.toString(),
        currency: order.currency,
        name: "Counsellor Wala",
        description: "Premium Access (30 Days)",
        image: "/logo.png",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            toast.loading("Verifying your payment...", { id: "verify" });
            
            // 3. Verify on backend (token auto-attached)
            const { data: verifyData } = await api.post("/payments/verify", {
              firebase_uid: user.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setIsPremium(true);
            toast.success("Payment successful! Welcome to Pro.", { id: "verify" });
          } catch (err) {
            toast.error("Payment verification failed. Please contact support.", { id: "verify" });
          }
        },
        prefill: {
          name: user.displayName || "Student",
          email: user.email || "",
          contact: ""
        },
        theme: {
          color: "#f97316"
        }
      };

      const rzpay = new Razorpay(options);
      rzpay.open();
      
      rzpay.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });

    } catch (error) {
      toast.dismiss();
      toast.error("Could not process your request right now.");
    }
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, aiMessageCount, triggerPaymentFlow, updateAiMessageCount, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
