"use client";

import { useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";
import { initWeb3Modal } from "@/config/web3modal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduce retries to avoid rate limiting
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 60000, // 60 seconds - cache longer to reduce requests
      gcTime: 300000, // 5 minutes - keep in cache longer
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Web3Modal after component mounts
    if (typeof window !== "undefined") {
      try {
        initWeb3Modal();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize Web3Modal:", error);
        // Still set ready to true to allow the app to continue
        setIsReady(true);
      }
    }
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
