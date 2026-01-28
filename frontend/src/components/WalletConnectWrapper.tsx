"use client";

import { useAccount, useDisconnect, useConnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";

function WalletConnectContent() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const web3Modal = useWeb3Modal();

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    console.log("Connect button clicked");
    
    try {
      // Try Web3Modal first
      console.log("Opening Web3Modal...");
      await web3Modal.open();
    } catch (error: any) {
      console.error("Web3Modal error:", error);
      
      // Fallback to direct MetaMask connection
      console.log("Trying direct MetaMask connection...");
      const injectedConnector = connectors.find((c) => c.id === "injected" || c.name === "MetaMask");
      if (injectedConnector) {
        try {
          await connect({ connector: injectedConnector });
        } catch (connectError: any) {
          console.error("Connection error:", connectError);
          alert("Failed to connect. Please make sure MetaMask is installed and unlocked.");
        }
      } else {
        alert("No wallet found. Please install MetaMask.");
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Connect your wallet to start burning NFTs
        </p>
      </div>
      <div className="flex items-center gap-4">
        {isConnected ? (
          <>
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Connected</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">
                {formatAddress(address)}
              </p>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-lg"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

export default function WalletConnect() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Web3Modal is initialized in Providers, just wait a bit for it to be ready
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Only render content after a brief delay
  if (!ready) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        </div>
        <button
          disabled
          className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
        >
          Loading...
        </button>
      </div>
    );
  }

  return <WalletConnectContent />;
}
