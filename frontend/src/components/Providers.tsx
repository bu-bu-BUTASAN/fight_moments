"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

// Sui dApp Kit styles
import "@mysten/dapp-kit/dist/index.css";

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "testnet";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000, // 1 minute
            gcTime: 300000, // 5 minutes
          },
        },
      }),
  );

  const networks = {
    [NETWORK]: {
      url: getFullnodeUrl(NETWORK),
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={NETWORK}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
