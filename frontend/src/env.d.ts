/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Sui Network Configuration
    readonly NEXT_PUBLIC_SUI_NETWORK: "testnet" | "devnet" | "mainnet";
    readonly NEXT_PUBLIC_SUI_RPC_URL: string;

    // Sui Contract Configuration
    readonly NEXT_PUBLIC_PACKAGE_ID: string;
    readonly NEXT_PUBLIC_TRANSFER_POLICY_ID: string;
    readonly NEXT_PUBLIC_COLLECTION_ID: string;

    // Walrus Configuration
    readonly NEXT_PUBLIC_WALRUS_RELAY_URL: string;
  }
}
