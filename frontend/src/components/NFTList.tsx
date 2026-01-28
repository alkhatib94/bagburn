"use client";

import { useState, useEffect, useMemo } from "react";
import { useNFTs } from "@/hooks/useNFTs";
import { useNFTsFromAPI } from "@/hooks/useNFTsFromAPI";
import { CONTRACTS } from "@/config/contracts";
import NFTCard from "./NFTCard";

interface NFT {
  tokenId: number;
  contract: string;
  contractName: string;
  burnValue: number;
}

interface NFTListProps {
  selectedNFTs: Array<{ tokenId: number; contract: string }>;
  onSelectionChange: (nfts: Array<{ tokenId: number; contract: string }>) => void;
}

export default function NFTList({ selectedNFTs, onSelectionChange }: NFTListProps) {
  const { nfts: nftsFromContract, isLoading: isLoadingContract, error: contractError } = useNFTs();
  const { nfts: nftsFromAPI, isLoading: isLoadingAPI, error: apiError } = useNFTsFromAPI();
  const [mounted, setMounted] = useState(false);

  // Use contract NFTs if available and not loading, otherwise fallback to API
  // Only use contract NFTs if they exist AND contract loading is done
  const shouldUseContractNFTs = nftsFromContract.length > 0 && !isLoadingContract;
  const nfts = shouldUseContractNFTs ? nftsFromContract : nftsFromAPI;
  // isLoading should be true if EITHER is loading (not both)
  const isLoading = isLoadingContract || isLoadingAPI;
  const error = contractError || apiError;

  // Debug logging
  useEffect(() => {
    console.log("NFTList Debug:", {
      nftsFromContract: nftsFromContract.length,
      nftsFromAPI: nftsFromAPI.length,
      isLoadingContract,
      isLoadingAPI,
      shouldUseContractNFTs,
      finalNFTs: nfts.length,
      contractError: contractError?.message,
      apiError: apiError?.message,
    });
  }, [nftsFromContract.length, nftsFromAPI.length, isLoadingContract, isLoadingAPI, shouldUseContractNFTs, nfts.length, contractError, apiError]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group NFTs by contract using useMemo to prevent infinite loops
  const groupedNFTs = useMemo(() => {
    const grouped: Record<string, NFT[]> = {};
    nfts.forEach((nft) => {
      if (!grouped[nft.contract]) {
        grouped[nft.contract] = [];
      }
      grouped[nft.contract].push(nft);
    });
    return grouped;
  }, [nfts]);

  const toggleNFT = (nft: NFT) => {
    const isSelected = selectedNFTs.some(
      (s) => s.tokenId === nft.tokenId && s.contract === nft.contract
    );

    if (isSelected) {
      onSelectionChange(
        selectedNFTs.filter(
          (s) => !(s.tokenId === nft.tokenId && s.contract === nft.contract)
        )
      );
    } else {
      onSelectionChange([...selectedNFTs, { tokenId: nft.tokenId, contract: nft.contract }]);
    }
  };

  const isSelected = (nft: NFT) => {
    return selectedNFTs.some(
      (s) => s.tokenId === nft.tokenId && s.contract === nft.contract
    );
  };

  const selectAllFromContract = (contract: string) => {
    const contractNFTs = groupedNFTs[contract] || [];
    const allSelected = contractNFTs.every((nft) => isSelected(nft));
    
    if (allSelected) {
      // Deselect all from this contract
      onSelectionChange(
        selectedNFTs.filter((s) => s.contract !== contract)
      );
    } else {
      // Select all from this contract
      const newSelection = [...selectedNFTs];
      contractNFTs.forEach((nft) => {
        if (!isSelected(nft)) {
          newSelection.push({ tokenId: nft.tokenId, contract: nft.contract });
        }
      });
      onSelectionChange(newSelection);
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your NFTs
        </h2>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-300">Loading your NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your NFTs
        </h2>
        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200 mb-2">
            Error loading NFTs
          </p>
          <p className="text-sm text-red-600 dark:text-red-300">
            {error.message || "Please check the console for details"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Make sure you're connected to Base Mainnet and the NFT contracts are correct.
          </p>
        </div>
      </div>
    );
  }

  // Only show "no NFTs" message if both methods have finished loading and found nothing
  if (nfts.length === 0 && !isLoadingContract && !isLoadingAPI) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your NFTs
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          No supported NFTs found in your wallet
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 space-y-2">
          <p>Supported contracts:</p>
          <p className="font-mono text-xs break-all">
            BAG Cardano: {CONTRACTS.BAG_CARDANO_NFT}
          </p>
          <p className="font-mono text-xs break-all">
            BAG Base: {CONTRACTS.BAG_BASE_NFT}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your NFTs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {selectedNFTs.length} selected
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedNFTs).map(([contract, contractNFTs]) => (
          <div key={contract} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contractNFTs[0]?.contractName || "Unknown"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {contractNFTs.length} NFT{contractNFTs.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => selectAllFromContract(contract)}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {contractNFTs.every((nft) => isSelected(nft)) ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {contractNFTs.map((nft) => (
                <NFTCard
                  key={`${nft.contract}-${nft.tokenId}`}
                  nft={nft}
                  isSelected={isSelected(nft)}
                  onToggle={() => toggleNFT(nft)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
