"use client";

import { useState, useEffect, useMemo } from "react";
import { useReadContract, useReadContracts, useWatchBlockNumber } from "wagmi";
import { CONTRACTS, ERC721_ABI, BAG_BURN_ABI } from "@/config/contracts";

interface NFTStatsData {
  contract: string;
  contractName: string;
  totalSupply: number | null;
  burned: number;
  remaining: number | null;
}

// Move nftContracts outside component to prevent recreation on every render
const NFT_CONTRACTS = [
  { address: CONTRACTS.BAG_CARDANO_NFT, name: "BAG Cornucopias (Cardano)" },
  { address: CONTRACTS.BAG_BASE_NFT, name: "BAG Cornucopias (BASE)" },
] as const;

export default function NFTStats() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<NFTStatsData[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get total supply for each contract (may not be supported by all ERC721)
  const totalSupplyContracts = useMemo(() => NFT_CONTRACTS.map((nft) => ({
    address: nft.address as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "totalSupply" as const,
  })), []);

  const { data: totalSupplies, refetch: refetchTotalSupply, error: totalSupplyError } = useReadContracts({
    contracts: totalSupplyContracts,
    query: {
      retry: false, // Don't retry if totalSupply is not supported
    },
  });

  // Get burned count (balance of BAG_BURN contract for each NFT contract)
  const burnedContracts = useMemo(() => NFT_CONTRACTS.map((nft) => ({
    address: nft.address as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "balanceOf" as const,
    args: CONTRACTS.BAG_BURN ? [CONTRACTS.BAG_BURN] : undefined,
  })), []);

  const { data: burnedCounts, refetch: refetchBurned } = useReadContracts({
    contracts: CONTRACTS.BAG_BURN ? burnedContracts : [],
    query: {
      enabled: !!CONTRACTS.BAG_BURN,
      staleTime: 30000, // Cache for 30 seconds
    },
  });

  // Watch for new blocks to update stats (throttled to avoid too many requests)
  const [lastRefetch, setLastRefetch] = useState(0);
  useWatchBlockNumber({
    onBlockNumber() {
      // Only refetch every 30 seconds to avoid rate limiting
      const now = Date.now();
      if (now - lastRefetch > 30000) {
        refetchTotalSupply();
        refetchBurned();
        setLastRefetch(now);
      }
    },
    enabled: true,
  });

  // Update stats when data changes
  useEffect(() => {
    if (burnedCounts) {
      const newStats: NFTStatsData[] = NFT_CONTRACTS.map((nft, index) => {
        const totalSupply = totalSupplies?.[index]?.result as bigint | undefined;
        const burned = burnedCounts[index]?.result as bigint | undefined;

        return {
          contract: nft.address,
          contractName: nft.name,
          totalSupply: totalSupply ? Number(totalSupply) : null,
          burned: burned ? Number(burned) : 0,
          remaining: totalSupply ? Number(totalSupply) - (burned ? Number(burned) : 0) : null,
        };
      });
      setStats(newStats);
    }
  }, [totalSupplies, burnedCounts]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        NFT Statistics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.contract}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg p-6 border border-blue-200 dark:border-gray-600"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {stat.contractName}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Supply:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stat.totalSupply !== null ? stat.totalSupply.toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Burned:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {stat.burned.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-300 font-semibold">Remaining:</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  {stat.remaining !== null ? stat.remaining.toLocaleString() : "N/A"}
                </span>
              </div>
              {stat.totalSupply !== null && stat.remaining !== null && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(stat.burned / stat.totalSupply) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {((stat.burned / stat.totalSupply) * 100).toFixed(2)}% Burned
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
