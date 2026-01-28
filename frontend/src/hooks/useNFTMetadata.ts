"use client";

import { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { ERC721_ABI } from "@/config/contracts";

interface NFTMetadata {
  image?: string;
  name?: string;
  description?: string;
}

// Global rate limit tracking
let metadataFetchQueue: Array<() => void> = [];
let isProcessingQueue = false;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 200; // 200ms between fetches to avoid rate limiting

const processQueue = () => {
  if (isProcessingQueue || metadataFetchQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime;
  const delay = Math.max(0, MIN_FETCH_INTERVAL - timeSinceLastFetch);
  
  setTimeout(() => {
    const next = metadataFetchQueue.shift();
    if (next) {
      lastFetchTime = Date.now();
      next();
    }
    isProcessingQueue = false;
    if (metadataFetchQueue.length > 0) {
      processQueue();
    }
  }, delay);
};

export function useNFTMetadata(contract: string, tokenId: number, enabled: boolean = true) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const hasFetchedRef = useRef(false);

  // Get tokenURI from contract - only fetch when shouldFetch is true
  const { data: tokenURI, error: tokenURIError } = useReadContract({
    address: contract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
    query: {
      enabled: enabled && shouldFetch && !!contract && tokenId !== undefined,
      retry: 0, // Don't retry to avoid rate limiting
      staleTime: 300000, // Cache for 5 minutes
    },
  });

  // Enable fetching when component is visible or on demand
  useEffect(() => {
    if (!enabled || hasFetchedRef.current) return;
    
    // Delay initial fetch to avoid loading all metadata at once
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, Math.random() * 1000); // Random delay 0-1s to spread out requests
    
    return () => clearTimeout(timer);
  }, [enabled]);

  // Reset when contract or tokenId changes
  useEffect(() => {
    hasFetchedRef.current = false;
    setShouldFetch(false);
    setMetadata(null);
  }, [contract, tokenId]);

  useEffect(() => {
    if (!tokenURI || typeof tokenURI !== "string" || hasFetchedRef.current) {
      if (tokenURIError) {
        // If rate limited, disable further fetching
        if (tokenURIError.message?.includes("rate limit") || 
            tokenURIError.message?.includes("429") ||
            (tokenURIError as any).code === -32016) {
          console.warn(`Rate limit detected for token ${tokenId}, skipping metadata fetch`);
          hasFetchedRef.current = true;
        }
      }
      return;
    }

    hasFetchedRef.current = true;

    // Queue the metadata fetch to avoid rate limiting
    const fetchMetadata = async () => {
      setIsLoading(true);
      try {
        let uri = tokenURI;
        
        // Handle IPFS URLs
        if (uri.startsWith("ipfs://")) {
          uri = `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
        } else if (uri.startsWith("ipfs/")) {
          uri = `https://ipfs.io/${uri}`;
        }
        
        // Handle data URIs
        if (uri.startsWith("data:")) {
          const base64Data = uri.split(",")[1];
          const jsonData = JSON.parse(atob(base64Data));
          setMetadata(jsonData);
          setIsLoading(false);
          return;
        }

        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process image URL
        let imageUrl = data.image;
        if (imageUrl) {
          if (imageUrl.startsWith("ipfs://")) {
            imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`;
          } else if (imageUrl.startsWith("ipfs/")) {
            imageUrl = `https://ipfs.io/${imageUrl}`;
          }
        }
        
        setMetadata({
          name: data.name,
          description: data.description,
          image: imageUrl,
        });
      } catch (error) {
        console.error(`Error fetching metadata for token ${tokenId}:`, error);
        setMetadata(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add to queue instead of fetching immediately
    metadataFetchQueue.push(fetchMetadata);
    processQueue();
  }, [tokenURI, tokenId, tokenURIError]);

  return { metadata, isLoading };
}
