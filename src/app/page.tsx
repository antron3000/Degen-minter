'use client';

import { useState, useCallback, useEffect } from 'react';
import { BitcoinWalletButton } from '@/components/BitcoinWalletButton';
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { createInscriptionRequest, sendPayment, verifyPayment, type InscriptionRequest, type PaymentVerification } from '@/lib/api';
import { toast } from 'sonner';

declare global {
  interface Window {
    unisat?: {
      sendBitcoin: (toAddress: string, amount: number, options?: { feeRate: number }) => Promise<string>;
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getPublicKey: () => Promise<string>;
      signMessage: (message: string, type?: string) => Promise<string>;
      getNetwork: () => Promise<string>;
      switchNetwork: (network: 'livenet' | 'testnet') => Promise<void>;
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    };
  }
}

type MintStatus = 'idle' | 'requesting' | 'awaiting_payment' | 'verifying' | 'completed' | 'error';

export default function Home() {
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');
  const [inscriptionRequest, setInscriptionRequest] = useState<InscriptionRequest | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentVerification | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { isConnected, walletAddress } = useBitcoinWallet();
  
  // Using the 1.png image from the public folder
  const preview = "/1.png";

  // Handle payment with UniSat wallet
  const handlePayWithWallet = async () => {
    if (!inscriptionRequest || !walletAddress) return;
    
    setIsPaying(true);
    setPaymentError(null);
    
    try {
      if (!window.unisat) {
        throw new Error('UniSat wallet not detected. Please install the UniSat extension.');
      }
      
      // Send payment using UniSat wallet with amount in sats
      const txid = await window.unisat.sendBitcoin(
        inscriptionRequest.paymentAddress,
        inscriptionRequest.required_amount_in_sats,
        { feeRate: inscriptionRequest.fee_rate }
      );
      
      // Start polling for payment verification
      setMintStatus('verifying');
      toast.success('Payment sent! Verifying transaction...');
      
      // Poll for verification
      const verifyInterval = setInterval(async () => {
        try {
          const verification = await verifyPayment(inscriptionRequest.requestId, txid);
          setPaymentStatus(verification);
          
          if (verification.status === 'completed') {
            setMintStatus('completed');
            toast.success('Inscription completed successfully!');
            clearInterval(verifyInterval);
          } else if (verification.status === 'failed') {
            setMintStatus('error');
            setPaymentError('Payment verification failed');
            clearInterval(verifyInterval);
          }
        } catch (error) {
          console.error('Verification error:', error);
          clearInterval(verifyInterval);
        }
      }, 5000);
      
      // Cleanup interval on component unmount
      return () => clearInterval(verifyInterval);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Failed to process payment');
      toast.error('Payment failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleMint = useCallback(async () => {
    if (!walletAddress) return;
    
    setMintStatus('requesting');
    
    try {
      // Step 1: Create inscription request
      const request = await createInscriptionRequest(walletAddress);
      setInscriptionRequest(request);
      setMintStatus('awaiting_payment');
      
      toast.success('Inscription request created', {
        description: `Please send ${request.amount} BTC to ${request.paymentAddress}`,
      });
      
    } catch (error: any) {
      console.error('Minting error:', error);
      setMintStatus('error');
      toast.error('Failed to create inscription', {
        description: error.message || 'Please try again',
      });
    }
  }, [walletAddress]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-4xl mx-auto p-4 flex-1">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Degen Minter
          </h1>
          <BitcoinWalletButton />
        </header>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Left side - Image */}
          <div className="flex-1 max-w-md">
            <div className="w-full aspect-square">
              <img 
                src={preview} 
                alt="Degen NFT" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right side - Mint button */}
          <div className="flex-1 flex flex-col items-center">
            <button
              onClick={handleMint}
              disabled={!isConnected || !walletAddress || mintStatus === 'requesting'}
              className={`w-full max-w-xs py-4 px-8 rounded-full font-medium text-white text-lg transition-all ${
                !isConnected || !walletAddress || mintStatus === 'requesting'
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105'
              }`}
            >
              {!isConnected ? 'Connect Wallet to Mint' : 
               mintStatus === 'requesting' ? 'Creating Request...' : 
               !walletAddress ? 'No Wallet Address' : 'Create Inscription'}
            </button>

            {mintStatus === 'awaiting_payment' && inscriptionRequest && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg w-full max-w-xs">
                <h3 className="font-medium text-blue-800 mb-2">Complete Payment</h3>
                <div className="text-sm text-blue-700 mb-3">
                  Amount: <span className="font-mono font-bold">{(inscriptionRequest.required_amount_in_sats / 100000000).toFixed(8)} BTC</span>
                  <span className="text-xs text-gray-500 ml-2">({inscriptionRequest.required_amount_in_sats.toLocaleString()} sats)</span>
                </div>
                <div className="text-sm text-blue-700 mb-3">
                  Fee Rate: <span className="font-mono font-bold">{inscriptionRequest.fee_rate} sats/vB</span>
                </div>
                <div className="bg-white p-2 rounded border border-blue-200 mb-3 overflow-x-auto">
                  <code className="text-xs break-all">{inscriptionRequest.paymentAddress}</code>
                </div>
                
                <button
                  onClick={handlePayWithWallet}
                  disabled={isPaying}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 disabled:opacity-50 mb-2 flex items-center justify-center"
                >
                  {isPaying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Pay with UniSat Wallet'
                  )}
                </button>
                
                {paymentError && (
                  <div className="mt-2 text-sm text-red-600">
                    {paymentError}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  <p className="font-medium">Or send manually:</p>
                  <p>Send exactly {(inscriptionRequest.required_amount_in_sats / 100000000).toFixed(8)} BTC to the address above</p>
                  <p className="text-xs">({inscriptionRequest.required_amount_in_sats.toLocaleString()} sats)</p>
                </div>
              </div>
            )}

            {mintStatus === 'verifying' && (
              <div className="mt-4 text-sm text-blue-600">
                Verifying your payment. This may take a moment...
              </div>
            )}

            {mintStatus === 'completed' && paymentStatus?.inscriptionId && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Inscription Complete!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your inscription ID: <span className="font-mono">{paymentStatus.inscriptionId}</span>
                </p>
              </div>
            )}

            {!isConnected && (
              <p className="mt-4 text-sm text-gray-600 text-center">
                Connect your wallet to create an inscription
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm p-4">
        <p>Degen Minter - Mint your NFTs with ease on the blockchain</p>
      </footer>
    </div>
  );
}
