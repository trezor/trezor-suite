import type { NetworkSymbol } from '@suite-common/wallet-config';

export const YIELD_FLOW_TYPES = ['supply', 'withdraw'] as const;
export const YIELD_FLOW_STEPS = ['approve', 'action', 'complete'] as const;

export type YieldFlowType = (typeof YIELD_FLOW_TYPES)[number];
export type YieldFlowStepId = (typeof YIELD_FLOW_STEPS)[number];

export type YieldFlowFormValues = {
    amountInput: string;
};

export type YieldFlowDisplayToken = {
    networkSymbol: NetworkSymbol;
    symbol: string;
    decimals: number;
    contractAddress?: string | null;
    coingeckoId?: string;
};

export type YieldFlowToken = YieldFlowDisplayToken & {
    balance: string;
};

export type YieldFlowCompleteValue = {
    token: YieldFlowDisplayToken;
    amount: string;
};

export type YieldApproveModalState = {
    amount: string;
    contractAddress: string;
    spender: string;
    providerId?: string;
    preapprovedAmount?: string;
    txType: Extract<YieldPendingTransactionState['type'], 'approve' | 'revoke' | 'revoke-only'>;
};

export type YieldPendingTransactionState = {
    type: 'approve' | 'revoke' | 'revoke-only' | 'supply' | 'withdraw';
    txid: string;
    amount: string;
};
