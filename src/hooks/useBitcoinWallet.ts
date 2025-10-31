import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    unisat?: any;
  }
}

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export function useBitcoinWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<string>('livenet');
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch balance from Blockstream API
  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return;
    
    try {
      setIsLoadingBalance(true);
      // Use testnet API if not on mainnet
      const baseUrl = network === 'livenet' 
        ? 'https://blockstream.info/api' 
        : 'https://blockstream.info/testnet/api';
      
      const response = await fetch(`${baseUrl}/address/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      
      // Convert satoshis to BTC
      const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
      
      setBalance({
        confirmed: confirmed / 100000000, // Convert satoshis to BTC
        unconfirmed: unconfirmed / 100000000, // Convert satoshis to BTC
        total: (confirmed + unconfirmed) / 100000000 // Convert satoshis to BTC
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Error', {
        description: 'Failed to fetch wallet balance',
      });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [network]);

  const connectWallet = async () => {
    try {
      console.log('Attempting to connect wallet...');
      setIsLoading(true);
      
      if (!window.unisat) {
        const errorMsg = 'UniSat wallet not detected. Please install the UniSat extension.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Requesting accounts...');
      const accounts = await window.unisat.requestAccounts();
      console.log('Received accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        const errorMsg = 'No accounts found in UniSat wallet';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const address = accounts[0];
      console.log('Setting wallet address:', address);
      setWalletAddress(address);
      
      // Get network
      console.log('Getting network...');
      const currentNetwork = await window.unisat.getNetwork();
      console.log('Current network:', currentNetwork);
      setNetwork(currentNetwork);
      
      // Set connected state
      console.log('Setting connected state to true');
      setIsConnected(true);
      
      // Fetch balance after connecting
      console.log('Fetching balance...');
      await fetchBalance(address);
      
      console.log('Wallet connection successful');
      toast.success('Wallet Connected', {
        description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
      
      return address;
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setIsConnected(false);
      setWalletAddress(null);
      
      toast.error('Error', {
        description: err.message || 'Failed to connect wallet',
      });
      throw err;
    } finally {
      console.log('Connect wallet process completed');
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setNetwork('livenet');
    setBalance(null);
    if (window.unisat) {
      window.unisat.removeAllListeners();
    }
    toast.info('Wallet Disconnected');
  };

  // Check if wallet is connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.unisat) {
        try {
          const accounts = await window.unisat.getAccounts();
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);
            setIsConnected(true);
            const currentNetwork = await window.unisat.getNetwork();
            setNetwork(currentNetwork);
            await fetchBalance(address);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        await fetchBalance(address);
      } else {
        disconnectWallet();
      }
    };

    // Listen for network changes
    const handleNetworkChanged = (newNetwork: string) => {
      setNetwork(newNetwork);
      if (walletAddress) {
        fetchBalance(walletAddress);
      }
    };

    if (window.unisat) {
      window.unisat.on('accountsChanged', handleAccountsChanged);
      window.unisat.on('networkChanged', handleNetworkChanged);
    }

    return () => {
      if (window.unisat) {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged);
        window.unisat.removeListener('networkChanged', handleNetworkChanged);
      }
    };
  }, [fetchBalance, walletAddress]);

  return {
    walletAddress,
    isConnected,
    isLoading,
    isLoadingBalance,
    network,
    balance,
    connectWallet,
    disconnectWallet,
  };
}
