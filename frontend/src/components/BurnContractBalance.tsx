"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWatchBlockNumber } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/config/contracts";

export default function BurnContractBalance() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: balance, refetch } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: CONTRACTS.BAG_BURN ? [CONTRACTS.BAG_BURN] : undefined,
    query: {
      enabled: !!CONTRACTS.BAG_BURN,
    },
  });

  // Watch for new blocks to update balance
  useWatchBlockNumber({
    onBlockNumber() {
      refetch();
    },
  });

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance as bigint, 6)).toFixed(2)
    : "0.00";

  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg p-6 border border-green-200 dark:border-gray-600">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg p-6 border border-green-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Burn Contract Balance
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
            Available{" "}
            <span className="inline-flex items-center gap-1">
              <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
              USDC
            </span>
            {" "}in the burn contract
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {formattedBalance}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-end gap-1">
            <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
            USDC
          </p>
        </div>
      </div>
      {CONTRACTS.BAG_BURN && (
        <div className="mt-4 pt-4 border-t border-green-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
            Contract: {CONTRACTS.BAG_BURN}
          </p>
        </div>
      )}
    </div>
  );
}
