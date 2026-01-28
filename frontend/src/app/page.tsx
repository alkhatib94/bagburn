"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAccount, useChainId } from "wagmi";
import { BASE_CHAIN_ID } from "@/config/contracts";

// Dynamically import components that use wagmi to prevent SSR hydration issues
const WalletConnect = dynamic(() => import("@/components/WalletConnectWrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
      <button disabled className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed">
        Loading...
      </button>
    </div>
  ),
});

const NFTList = dynamic(() => import("@/components/NFTList"), {
  ssr: false,
});

const BurnInterface = dynamic(() => import("@/components/BurnInterface"), {
  ssr: false,
});

const USDCBalance = dynamic(() => import("@/components/USDCBalance"), {
  ssr: false,
});

const NFTStats = dynamic(() => import("@/components/NFTStats"), {
  ssr: false,
});

const BurnContractBalance = dynamic(() => import("@/components/BurnContractBalance"), {
  ssr: false,
});

function HomeContent() {
  const [selectedNFTs, setSelectedNFTs] = useState<Array<{tokenId: number, contract: string}>>([]);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === BASE_CHAIN_ID;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-2xl ring-4 ring-yellow-400/20 dark:ring-yellow-500/30">
                  <img
                    src="/BAG-MAIN.png"
                    alt="BAG Logo"
                    className="h-28 md:h-40 lg:h-48 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 dark:from-yellow-400 dark:via-yellow-300 dark:to-yellow-400 bg-clip-text text-transparent mb-4 tracking-tight">
              BAG Burn
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 flex-wrap">
              Burn your NFTs and receive{" "}
              <span className="inline-flex items-center gap-1">
                <img src="/usdc-logo.png" alt="USDC" className="h-6 w-6 inline-block" />
                USDC
              </span>
              {" "}on{" "}
              <span className="inline-flex items-center gap-1">
                <img src="/base-logo.jpeg" alt="Base" className="h-6 w-6 inline-block rounded" />
                Base
              </span>
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <WalletConnect />
            {isConnected && !isCorrectNetwork && (
              <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Please switch to Base Mainnet to continue.
                </p>
              </div>
            )}
          </div>

          {/* NFT Statistics - Always visible */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <NFTStats />
          </div>

          {/* Burn Contract Balance - Always visible */}
          <div className="mb-6">
            <BurnContractBalance />
          </div>

          {/* Main Content */}
          {isConnected && isCorrectNetwork && (
            <>
              {/* USDC Balance */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <USDCBalance />
              </div>

              {/* NFT List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <NFTList 
                  selectedNFTs={selectedNFTs}
                  onSelectionChange={setSelectedNFTs}
                />
              </div>

              {/* Burn Interface */}
              {selectedNFTs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <BurnInterface 
                    selectedNFTs={selectedNFTs}
                    onBurnComplete={() => setSelectedNFTs([])}
                  />
                </div>
              )}
            </>
          )}

          {/* Info Section */}
          {!isConnected && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Supported NFTs
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    BAG Cornucopias (Cardano)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Burn Value:{" "}
                    <span className="font-bold inline-flex items-center gap-1">
                      <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
                      10.4 USDC
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Contract: 0x6aa70c267e7de716116a518bf5203a7ef5fc5c68
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    BAG Cornucopias (BASE)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Burn Value:{" "}
                    <span className="font-bold inline-flex items-center gap-1">
                      <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
                      8 USDC
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Contract: 0x2d22e247ee09fa27ffee2421a56fe92d9a2a296c
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout to ensure this runs after hydration
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state only briefly
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-2xl ring-4 ring-yellow-400/20 dark:ring-yellow-500/30">
                    <img
                      src="/BAG-MAIN.png"
                      alt="BAG Logo"
                      className="h-28 md:h-40 lg:h-48 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 dark:from-yellow-400 dark:via-yellow-300 dark:to-yellow-400 bg-clip-text text-transparent mb-4 tracking-tight">
                BAG Burn
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 flex-wrap">
                Burn your NFTs and receive{" "}
                <span className="inline-flex items-center gap-1">
                  <img src="/usdc-logo.png" alt="USDC" className="h-6 w-6 inline-block" />
                  USDC
                </span>
                {" "}on{" "}
                <span className="inline-flex items-center gap-1">
                  <img src="/base-logo.jpeg" alt="Base" className="h-6 w-6 inline-block rounded" />
                  Base
                </span>
              </p>
            </div>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <HomeContent />;
}
