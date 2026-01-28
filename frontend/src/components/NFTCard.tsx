"use client";

import { useState, useEffect, useRef } from "react";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";

interface NFT {
  tokenId: number;
  contract: string;
  contractName: string;
  burnValue: number;
  image?: string;
  name?: string;
}

interface NFTCardProps {
  nft: NFT;
  isSelected: boolean;
  onToggle: () => void;
}

export default function NFTCard({ nft, isSelected, onToggle }: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Only fetch metadata when card is visible or hovered
  const shouldFetchMetadata = isVisible || isHovered;
  
  const { metadata, isLoading: metadataLoading } = useNFTMetadata(
    nft.contract,
    nft.tokenId,
    shouldFetchMetadata
  );

  // Intersection Observer to detect when card is visible
  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(cardRef.current);
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const imageUrl = metadata?.image || nft.image;
  const displayName = metadata?.name || `${nft.contractName} #${nft.tokenId}`;

  return (
    <div
      ref={cardRef}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-2 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {/* NFT Image */}
      <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {metadataLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = "/NFT.png";
            }}
          />
        ) : (
          <img
            src="/NFT.png"
            alt={`${displayName} placeholder`}
            className="w-full h-full object-cover opacity-80"
          />
        )}
      </div>

      {/* NFT Info */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
          {displayName}
        </span>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-3 h-3 text-blue-600 rounded ml-1 flex-shrink-0"
        />
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
          {nft.burnValue}{" "}
          <span className="inline-flex items-center gap-0.5">
            <img src="/usdc-logo.png" alt="USDC" className="h-3 w-3 inline-block" />
            <span className="text-xs">USDC</span>
          </span>
        </p>
      </div>
    </div>
  );
}
