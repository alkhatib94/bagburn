"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { CONTRACTS, BURN_VALUES } from "@/config/contracts";
import { formatUnits } from "viem";

interface NFT {
  tokenId: number;
  contract: string;
  contractName: string;
  burnValue: number;
}

export function useNFTsFromAPI() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setNfts([]);
      return;
    }

    const fetchNFTs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allNFTs: NFT[] = [];

        // Fetch NFTs from BaseScan API for each contract
        for (const contract of [
          { address: CONTRACTS.BAG_CARDANO_NFT, name: "BAG Cornucopias (Cardano)" },
          { address: CONTRACTS.BAG_BASE_NFT, name: "BAG Cornucopias (BASE)" },
        ]) {
          try {
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // BaseScan API endpoint - get NFT transfers (no API key needed for public endpoint)
            const url = `https://api.basescan.org/api?module=account&action=tokennfttx&contractaddress=${contract.address}&address=${address}&page=1&offset=1000&startblock=0&endblock=99999999&sort=asc`;
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
              },
            });
            
            if (!response.ok) {
              console.warn(`BaseScan API error for ${contract.name}: HTTP ${response.status}`);
              continue;
            }
            
            const data = await response.json();

            console.log(`BaseScan API response for ${contract.name}:`, data);

            if (data.status === "1" && data.result && Array.isArray(data.result)) {
              // Track current ownership by processing all transfers chronologically
              const ownershipMap = new Map<number, boolean>();
              
              // Process all transfers chronologically to determine current ownership
              data.result.forEach((tx: any) => {
                const tokenId = parseInt(tx.tokenID);
                if (isNaN(tokenId)) return;

                const from = tx.from?.toLowerCase();
                const to = tx.to?.toLowerCase();
                const userAddress = address.toLowerCase();

                // If transferred to user, mark as owned
                if (to === userAddress) {
                  ownershipMap.set(tokenId, true);
                }
                // If transferred from user to someone else, mark as not owned
                if (from === userAddress && to !== userAddress && to !== "0x0000000000000000000000000000000000000000") {
                  ownershipMap.set(tokenId, false);
                }
              });

              // Get all currently owned NFTs
              const ownedNFTs = Array.from(ownershipMap.entries())
                .filter(([_, owned]) => owned)
                .map(([tokenId]) => ({
                  tokenId: tokenId,
                  contract: contract.address,
                  contractName: contract.name,
                  burnValue: parseFloat(formatUnits(BigInt(BURN_VALUES[contract.address] || 0), 6)),
                  name: `${contract.name} #${tokenId}`,
                }));

              allNFTs.push(...ownedNFTs);
              console.log(`Found ${ownedNFTs.length} NFTs from ${contract.name} via BaseScan API`);
            } else if (data.status === "0" && data.message) {
              // Handle API errors gracefully
              if (data.message.includes("NOTOK") || data.message.includes("rate limit")) {
                console.warn(`BaseScan API rate limited for ${contract.name}, will retry later`);
              } else {
                console.warn(`BaseScan API warning for ${contract.name}:`, data.message);
              }
            } else {
              console.log(`No NFTs found via API for ${contract.name}`);
            }
          } catch (err) {
            console.error(`Error fetching NFTs from ${contract.address}:`, err);
          }
        }

        setNfts(allNFTs);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching NFTs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, isConnected]);

  return { nfts, isLoading, error };
}
