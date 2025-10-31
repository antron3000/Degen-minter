'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <ConnectButton 
        chainStatus="none"
        showBalance={false}
        accountStatus="address"
        label="Connect Wallet"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ConnectButton 
        chainStatus="none"
        showBalance={false}
        accountStatus="address"
      />
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
