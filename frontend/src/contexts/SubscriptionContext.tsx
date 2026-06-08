import { createContext, useContext, type ReactNode } from "react";

interface SubscriptionContextType {
  isPremium: boolean;
  aiMessageCount: number;
  triggerPaymentFlow: () => Promise<void>;
  updateAiMessageCount: () => Promise<void>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  return (
    <SubscriptionContext.Provider value={{
      isPremium: true,
      aiMessageCount: 0,
      triggerPaymentFlow: async () => {},
      updateAiMessageCount: async () => {},
      loading: false,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
