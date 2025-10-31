import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'Degen Minter',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [mainnet, sepolia],
  ssr: true,
});
