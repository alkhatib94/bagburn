"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useMemo, useEffect } from "react";
import { CONTRACTS, ERC721_ABI, BURN_VALUES } from "@/config/contracts";
import { formatUnits } from "viem";

interface NFT {
  tokenId: number;
  contract: string;
  contractName: string;
  burnValue: number;
  image?: string;
  name?: string;
}

export function useNFTs() {
  const { address, isConnected } = useAccount();

  const nftContracts = [
    { address: CONTRACTS.BAG_CARDANO_NFT, name: "BAG Cornucopias (Cardano)" },
    { address: CONTRACTS.BAG_BASE_NFT, name: "BAG Cornucopias (BASE)" },
  ];

  // Get balance for each NFT contract
  const balanceContracts = nftContracts.map((nft) => ({
    address: nft.address as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "balanceOf" as const,
    args: [address!] as const,
  }));

  const { data: balances, isLoading: balancesLoading, error: balancesError } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Debug logging
  useEffect(() => {
    if (balances) {
      console.log("NFT Balances:", balances);
      balances.forEach((balance, idx) => {
        const balanceValue = balance.result as bigint | undefined;
        console.log(`Contract ${nftContracts[idx].address}: ${balanceValue ? Number(balanceValue) : 0} NFTs`);
      });
    }
  }, [balances]);

  // Get all token IDs for each contract using tokenOfOwnerByIndex
  // Limit to first 5 NFTs per contract to avoid rate limiting
  const MAX_NFTS_PER_CONTRACT = 5;
  const tokenContracts = useMemo(() => {
    if (!balances || !address || balancesLoading) return [];
    
    const contracts: any[] = [];
    balances.forEach((balance, index) => {
      const balanceValue = balance.result as bigint | undefined;
      if (balanceValue && balanceValue > BigInt(0)) {
        const count = Math.min(Number(balanceValue), MAX_NFTS_PER_CONTRACT);
        for (let i = 0; i < count; i++) {
          contracts.push({
            address: nftContracts[index].address as `0x${string}`,
            abi: ERC721_ABI,
            functionName: "tokenOfOwnerByIndex" as const,
            args: [address, BigInt(i)] as const,
          });
        }
      }
    });
    return contracts;
  }, [balances, address, balancesLoading, nftContracts]);

  // Only fetch if we have contracts and not too many (to avoid rate limiting)
  const shouldFetchTokenIds = tokenContracts.length > 0 && tokenContracts.length <= MAX_NFTS_PER_CONTRACT * 2 && !balancesLoading;
  
  const { data: tokenIds, isLoading: tokenIdsLoading, error: tokenIdsError } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: shouldFetchTokenIds,
      retry: 0, // Don't retry to avoid rate limiting
      staleTime: 300000, // Cache for 5 minutes
      gcTime: 600000, // Keep in cache for 10 minutes
    },
  });

  // Check if tokenOfOwnerByIndex failed - if so, we'll need to use API fallback
  const hasTokenIdErrors = useMemo(() => {
    if (!tokenIds) return false;
    return tokenIds.some((t) => t.error);
  }, [tokenIds]);

  // Debug logging for token IDs
  useEffect(() => {
    if (tokenIds) {
      console.log("Token IDs fetched:", tokenIds);
      console.log("Number of token IDs:", tokenIds.length);
      tokenIds.forEach((tokenId, idx) => {
        if (tokenId.error) {
          console.error(`Error fetching token ${idx}:`, tokenId.error);
        } else if (tokenId.result) {
          console.log(`Token ${idx}:`, Number(tokenId.result as bigint));
        }
      });
    }
    if (tokenIdsError) {
      console.error("Token IDs error:", tokenIdsError);
    }
  }, [tokenIds, tokenIdsError]);

  // Create a stable key for tokenIds to prevent unnecessary recalculations
  const tokenIdsKey = useMemo(() => {
    if (!tokenIds) return "";
    return tokenIds.map((t, idx) => {
      if (t.error) return `error-${idx}`;
      if (t.result) return `result-${Number(t.result as bigint)}`;
      return `none-${idx}`;
    }).join(",");
  }, [tokenIds]);

  const balancesKey = useMemo(() => {
    if (!balances) return "";
    return balances.map((b, idx) => {
      const val = b.result as bigint | undefined;
      return val ? Number(val).toString() : "0";
    }).join(",");
  }, [balances]);

  const nfts: NFT[] = useMemo(() => {
    if (!address || tokenIdsLoading) {
      return [];
    }

    // If we have errors (especially rate limiting), return empty (will trigger API fallback)
    if (hasTokenIdErrors) {
      const hasRateLimitError = tokenIds?.some((t) => 
        t.error?.message?.includes("rate limit") || 
        t.error?.message?.includes("429") ||
        t.error?.code === -32016
      );
      if (hasRateLimitError) {
        console.warn("Rate limit detected, switching to API fallback");
      } else {
        console.warn("tokenOfOwnerByIndex failed, switching to API fallback");
      }
      return [];
    }

    if (!tokenIds) {
      return [];
    }

    const result: NFT[] = [];
    let tokenIndex = 0;

    balances?.forEach((balance, idx) => {
      const balanceValue = balance.result as bigint | undefined;
      if (balanceValue && balanceValue > BigInt(0)) {
        const count = Number(balanceValue);
        const contractAddress = nftContracts[idx].address;
        
        // Limit to MAX_NFTS_PER_CONTRACT to avoid rate limiting
        const maxCount = Math.min(count, MAX_NFTS_PER_CONTRACT);
        for (let i = 0; i < maxCount; i++) {
          const tokenIdData = tokenIds[tokenIndex];
          if (tokenIdData?.result) {
            try {
              const tokenId = Number(tokenIdData.result as bigint);
              result.push({
                tokenId: tokenId,
                contract: contractAddress,
                contractName: nftContracts[idx].name,
                burnValue: parseFloat(formatUnits(BigInt(BURN_VALUES[contractAddress] || 0), 6)),
                name: `${nftContracts[idx].name} #${tokenId}`,
              });
            } catch (error) {
              console.error(`Error processing token ${tokenIndex}:`, error);
            }
          }
          tokenIndex++;
        }
        
        // If user has more NFTs than limit, log that we're using API fallback
        if (count > MAX_NFTS_PER_CONTRACT) {
          console.log(`User has ${count} NFTs in ${nftContracts[idx].name}, showing first ${MAX_NFTS_PER_CONTRACT}, rest will come from API`);
        }
      }
    });

    return result;
  }, [tokenIdsKey, balancesKey, address, tokenIdsLoading, hasTokenIdErrors]);

  // Log errors for debugging
  if (balancesError) {
    console.error("Error fetching NFT balances:", balancesError);
  }
  if (tokenIdsError) {
    console.error("Error fetching token IDs:", tokenIdsError);
  }

  return { 
    nfts, 
    isLoading: balancesLoading || tokenIdsLoading,
    error: balancesError || tokenIdsError
  };
}
