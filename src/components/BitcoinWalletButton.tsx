'use client';

import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function BitcoinWalletButton() {
  const { 
    walletAddress, 
    isConnected, 
    isLoading, 
    isLoadingBalance,
    balance,
    network,
    connectWallet, 
    disconnectWallet 
  } = useBitcoinWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleClick = () => {
    if (isConnected) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      connectWallet().catch(console.error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(8).replace(/\.?0+$/, '') + ' BTC';
  };

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isConnected ? 'outline' : 'default'}
        className={cn("gap-2 transition-all", {
          'bg-accent/10': isDropdownOpen && isConnected,
        })}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span>{formatAddress(walletAddress || '')}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", {
              'transform rotate-180': isDropdownOpen,
            })} />
          </div>
        ) : (
          'Connect Wallet'
        )}
      </Button>

      {isConnected && isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b">
            <div className="text-sm font-medium text-muted-foreground">Connected Wallet</div>
            <div className="text-sm font-mono mt-1">{walletAddress}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {network === 'livenet' ? 'Mainnet' : 'Testnet'}
            </div>
          </div>
          
          <div className="p-4 border-b">
            <div className="text-sm font-medium text-muted-foreground">Balance</div>
            {isLoadingBalance ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : balance ? (
              <div className="mt-1">
                <div className="text-lg font-semibold">
                  {formatBalance(balance.total)}
                </div>
                {balance.unconfirmed > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatBalance(balance.unconfirmed)} unconfirmed
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">No balance</div>
            )}
          </div>
          
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
