import { NextResponse } from 'next/server';

// Mock database to store inscription requests
interface InscriptionRequestData {
  id: string;
  walletAddress: string;
  paymentAddress: string;
  amount: number;
  feeRate: number;
  status: 'pending' | 'paid' | 'completed' | 'failed';
  createdAt: string;
  paymentTxId?: string;
  inscriptionId?: string;
}

const inscriptionRequests = new Map<string, InscriptionRequestData>();

export async function POST(request: Request) {
  try {
    const { walletAddress, action, paymentTxId, requestId } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Step 1: Create inscription request
    if (!action) {
      // Generate a unique request ID
      const requestId = `req_${Date.now()}`;
      
      // In a real app, you would:
      // 1. Create an inscription request in your database
      // 2. Calculate the required payment amount based on the current fee rate
      // 3. Generate a payment address
      
      // Using 1 sat/vB as requested
      const currentFeeRate = 1; // sats/vbyte
      const mockPaymentAddress = 'tb1q9h0yjdupyfpxfjg24rpx755xrpcv2z8q6z6z6z';
      
      // Calculate the fee based on a typical transaction size (in vbytes)
      // A typical P2WPKH input is ~68 vbytes, output is ~31 vbytes
      const inputSize = 68;
      const outputSize = 31;
      const baseTxSize = 10; // overhead and such
      const totalVBytes = inputSize + (outputSize * 2) + baseTxSize; // 1 input, 2 outputs (payment + change)
      
      // Calculate the fee in sats (rounded up to the nearest integer)
      const feeSats = Math.ceil(totalVBytes * currentFeeRate);
      
      // The actual amount we want to send (in sats)
      const sendAmountSats = 10000; // This would come from your service
      
      // Total amount needed (send amount + fee)
      const totalAmountSats = sendAmountSats + feeSats;
      
      // Store the request with amount in sats
      inscriptionRequests.set(requestId, {
        id: requestId,
        walletAddress,
        paymentAddress: mockPaymentAddress,
        amount: totalAmountSats,
        feeRate: currentFeeRate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      
      return NextResponse.json({
        success: true,
        requestId,
        paymentAddress: mockPaymentAddress,
        required_amount_in_sats: totalAmountSats,
        fee_rate: currentFeeRate,
        // Include breakdown for transparency
        amount_breakdown: {
          send_amount_sats: sendAmountSats,
          fee_sats: feeSats,
          total_amount_sats: totalAmountSats,
          fee_rate: currentFeeRate,
          estimated_vbytes: totalVBytes
        },
        message: 'Please send payment to complete your inscription',
      });
    }
    
    // Step 2: Verify payment
    if (action === 'verify' && requestId) {
      const request = inscriptionRequests.get(requestId);
      
      if (!request) {
        return NextResponse.json(
          { error: 'Invalid request ID' },
          { status: 404 }
        );
      }
      
      // In a real app, you would:
      // 1. Verify the payment was made to the correct address
      // 2. Check the amount is sufficient
      // 3. Process the inscription
      
      // For now, we'll simulate a successful payment
      request.status = 'paid';
      request.paymentTxId = paymentTxId;
      
      // Simulate inscription processing
      setTimeout(() => {
        request.status = 'completed';
        request.inscriptionId = `inscription_${Date.now()}`;
      }, 5000);
      
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Payment received. Processing your inscription...',
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
