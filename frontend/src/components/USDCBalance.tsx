"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWatchBlockNumber } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/config/contracts";

export default function USDCBalance() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: balance, refetch } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            USDC Balance
          </h2>
          <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
            Your current{" "}
            <span className="inline-flex items-center gap-1">
              <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
              USDC
            </span>
            {" "}balance on{" "}
            <span className="inline-flex items-center gap-1">
              <img src="/base-logo.jpeg" alt="Base" className="h-4 w-4 inline-block rounded" />
              Base
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            0.00
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-end gap-1">
            <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
            USDC
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          USDC Balance
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your current USDC balance on Base
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
  );
}
