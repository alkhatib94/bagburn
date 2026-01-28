"use client";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { wagmiConfig, projectId } from "./wagmi";

let web3ModalInitialized = false;

export function initWeb3Modal() {
  if (web3ModalInitialized) {
    console.log("Web3Modal already initialized");
    return;
  }

  if (!projectId) {
    console.warn("WalletConnect Project ID not set. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
    return;
  }

  if (typeof window === "undefined") {
    console.log("Window not available, skipping Web3Modal initialization");
    return;
  }

  try {
    console.log("Initializing Web3Modal with projectId:", projectId);
    createWeb3Modal({
      wagmiConfig,
      projectId,
      enableAnalytics: false,
    });
    web3ModalInitialized = true;
    console.log("✅ Web3Modal initialized successfully");
  } catch (error: any) {
    console.error("❌ Failed to initialize Web3Modal:", error);
    console.error("Error details:", error.message);
  }
}

// Don't auto-initialize here - let the component handle it
