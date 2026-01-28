"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { CONTRACTS, BAG_BURN_ABI, ERC721_ABI, BURN_VALUES } from "@/config/contracts";
import { formatUnits } from "viem";

interface BurnInterfaceProps {
  selectedNFTs: Array<{ tokenId: number; contract: string }>;
  onBurnComplete: () => void;
}

export default function BurnInterface({ selectedNFTs, onBurnComplete }: BurnInterfaceProps) {
  const { isConnected, address } = useAccount();
  const { open } = useWeb3Modal();
  const [burning, setBurning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState<Record<string, boolean>>({});

  // Calculate total USDC amount
  const totalAmount = selectedNFTs.reduce((sum, nft) => {
    return sum + Number(BURN_VALUES[nft.contract as keyof typeof BURN_VALUES] || 0);
  }, 0);

  const formattedAmount = parseFloat(formatUnits(BigInt(totalAmount), 6)).toFixed(2);

  // Group NFTs by contract for batch burning
  const groupedByContract = selectedNFTs.reduce((acc, nft) => {
    if (!acc[nft.contract]) {
      acc[nft.contract] = [];
    }
    acc[nft.contract].push(nft.tokenId);
    return acc;
  }, {} as Record<string, number[]>);

  // Get unique contracts
  const uniqueContracts = Array.from(new Set(selectedNFTs.map(nft => nft.contract)));

  // Check approvals for each contract
  const approvalChecks = useReadContracts({
    contracts: address && CONTRACTS.BAG_BURN && uniqueContracts.length > 0
      ? uniqueContracts.map(contract => ({
          address: contract as `0x${string}`,
          abi: ERC721_ABI,
          functionName: "isApprovedForAll",
          args: [address, CONTRACTS.BAG_BURN],
        }))
      : [],
    query: {
      enabled: !!address && !!CONTRACTS.BAG_BURN && uniqueContracts.length > 0,
    },
  });

  // Update needsApproval state when approval checks complete
  useEffect(() => {
    if (approvalChecks.data && address && CONTRACTS.BAG_BURN) {
      const approvalStatus: Record<string, boolean> = {};
      uniqueContracts.forEach((contract, index) => {
        const isApproved = approvalChecks.data?.[index]?.result as boolean;
        approvalStatus[contract] = !isApproved;
      });
      setNeedsApproval(approvalStatus);
    }
  }, [approvalChecks.data, address, uniqueContracts]);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { writeContract: writeApproval, data: approvalHash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // After approval succeeds, check approvals again
  useEffect(() => {
    if (isApprovalSuccess) {
      approvalChecks.refetch();
      setApproving(false);
    }
  }, [isApprovalSuccess]);

  const handleApprove = async (contract: string) => {
    if (!isConnected || !address || !CONTRACTS.BAG_BURN) {
      return;
    }

    setApproving(true);

    try {
      await writeApproval({
        address: contract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: "setApprovalForAll",
        args: [CONTRACTS.BAG_BURN as `0x${string}`, true],
      });
    } catch (err) {
      console.error("Approval error:", err);
      setApproving(false);
    }
  };

  const handleBurn = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (!CONTRACTS.BAG_BURN) {
      alert("BAG Burn contract address not set. Please configure NEXT_PUBLIC_BAG_BURN_ADDRESS");
      return;
    }

    // Check if any contract needs approval
    const contractsNeedingApproval = uniqueContracts.filter(contract => needsApproval[contract]);
    if (contractsNeedingApproval.length > 0) {
      alert(`Please approve the contracts first. You need to approve: ${contractsNeedingApproval.join(", ")}`);
      return;
    }

    setBurning(true);

    try {
      // Burn NFTs grouped by contract
      const contracts = Object.keys(groupedByContract);
      
      for (const contract of contracts) {
        const tokenIds = groupedByContract[contract];
        
        if (tokenIds.length === 1) {
          // Single NFT burn
          await writeContract({
            address: CONTRACTS.BAG_BURN as `0x${string}`,
            abi: BAG_BURN_ABI,
            functionName: "burnNFT",
            args: [BigInt(tokenIds[0]), contract as `0x${string}`],
          });
        } else {
          // Multiple NFTs burn
          await writeContract({
            address: CONTRACTS.BAG_BURN as `0x${string}`,
            abi: BAG_BURN_ABI,
            functionName: "burnMultipleNFTs",
            args: [tokenIds.map(id => BigInt(id)), contract as `0x${string}`],
          });
        }
      }
    } catch (err) {
      console.error("Burn error:", err);
    } finally {
      setBurning(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Burn Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your NFTs have been burned and{" "}
            <span className="inline-flex items-center gap-1">
              <img src="/usdc-logo.png" alt="USDC" className="h-4 w-4 inline-block" />
              {formattedAmount} USDC
            </span>
            {" "}has been sent to your wallet.
          </p>
          {hash && (
            <a
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              View on BaseScan
            </a>
          )}
        </div>
        <button
          onClick={onBurnComplete}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          Burn More NFTs
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Burn Selected NFTs
      </h2>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 dark:text-gray-300">Number of NFTs:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {selectedNFTs.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Total USDC:</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
            {formattedAmount}{" "}
            <span className="inline-flex items-center gap-1">
              <img src="/usdc-logo.png" alt="USDC" className="h-5 w-5 inline-block" />
              USDC
            </span>
          </span>
        </div>
      </div>

      {/* Approval Status */}
      {uniqueContracts.length > 0 && (
        <div className="mb-4 space-y-2">
          {uniqueContracts.map((contract) => {
            const needsApprove = needsApproval[contract];
            const contractName = selectedNFTs.find(nft => nft.contract === contract)?.contractName || contract;
            
            if (needsApprove) {
              return (
                <div key={contract} className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                    You need to approve <strong>{contractName}</strong> before burning.
                  </p>
                  <button
                    onClick={() => handleApprove(contract)}
                    disabled={approving || isApprovalConfirming}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {approving || isApprovalConfirming ? "Approving..." : `Approve ${contractName}`}
                  </button>
                </div>
              );
            }
            return (
              <div key={contract} className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  ✓ {contractName} is approved
                </p>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">
            Error: {error.message}
          </p>
        </div>
      )}

      <button
        onClick={handleBurn}
        disabled={isPending || isConfirming || burning || Object.values(needsApproval).some(v => v)}
        className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
      >
        {isPending || isConfirming || burning
          ? "Processing..."
          : `Burn ${selectedNFTs.length} NFT${selectedNFTs.length !== 1 ? "s" : ""} for ${formattedAmount} USDC`}
      </button>

      {hash && (
        <div className="mt-4 text-center">
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline text-sm"
          >
            View transaction on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}
