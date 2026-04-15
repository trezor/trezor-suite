import type { NetworkSymbol } from '@suite-common/wallet-config';

export const YIELD_FLOW_STEPS = ['approve', 'action', 'complete'] as const;

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
    value: string;
};
