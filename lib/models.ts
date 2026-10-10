export interface Invoice {
  id: string;
  description: string;
  amount: string;
  recipient: string;
  status: 'pending' | 'paid';
  createdAt: number;
  txHash: string | null;
  payer: string | null;
  paidAt: number | null;
}
