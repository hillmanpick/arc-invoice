export interface Invoice {
  id: string;
  description: string;
  amount: string;
  recipient: string;
  expectedPayer: string | null;
  status: 'pending' | 'paid';
  createdAt: number;
  txHash: string | null;
  payer: string | null;
  paidAt: number | null;
}

export interface AddressHistory {
  address: string;
  count: number;
  lastUsedAt: number;
}
