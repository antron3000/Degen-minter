export interface InscriptionRequest {
  success: boolean;
  requestId: string;
  paymentAddress: string;
  required_amount_in_sats: number;
  fee_rate: number;
  message: string;
  // For backward compatibility
  amount?: number;
  feeRate?: number;
}

export interface PaymentVerification {
  success: boolean;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  inscriptionId?: string;
}

interface SendPaymentParams {
  toAddress: string;
  amount: number; // in sats
  feeRate: number; // in sats/byte
}

// Extend the Window interface to include unisat
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

export async function createInscriptionRequest(walletAddress: string): Promise<InscriptionRequest> {
  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create inscription request');
    }

    return await response.json();
  } catch (error) {
    console.error('Inscription request error:', error);
    throw error;
  }
}

export async function sendPayment({ toAddress, amount, feeRate }: SendPaymentParams): Promise<{ txid: string }> {
  if (!window.unisat) {
    throw new Error('UniSat wallet not detected. Please install the UniSat extension.');
  }

  try {
    const txid = await window.unisat.sendBitcoin(toAddress, amount, { feeRate });
    return { txid };
  } catch (error: any) {
    console.error('Payment error:', error);
    throw new Error(`Failed to send payment: ${error.message}`);
  }
}

export async function verifyPayment(requestId: string, paymentTxId: string): Promise<PaymentVerification> {
  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify',
        requestId,
        paymentTxId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}
