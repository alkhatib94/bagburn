import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

if (!projectId) {
  console.warn("WalletConnect Project ID not set. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
}

const metadata = {
  name: "BAG Burn",
  description: "Burn NFTs for USDC on Base",
  url: typeof window !== "undefined" ? window.location.origin : "https://bagburn.com",
  icons: ["https://bagburn.com/icon.png"],
};

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(projectId ? [walletConnect({ projectId, metadata, showQrModal: true })] : []),
  ],
  transports: {
    [base.id]: http(undefined, {
      retryCount: 2,
      retryDelay: 1000,
    }),
    [baseSepolia.id]: http(undefined, {
      retryCount: 2,
      retryDelay: 1000,
    }),
  },
});
