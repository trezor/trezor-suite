import type { YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import type { EvmHexString } from '@suite-common/schemas/src/evm';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

export const YIELD_FLOW_TYPES = ['deposit', 'withdraw', 'redeem', 'claim'] as const;
export const YIELD_FLOW_STEPS = ['wrap', 'approve', 'action', 'unwrap', 'complete'] as const;

export type YieldFlowType = (typeof YIELD_FLOW_TYPES)[number];
export type YieldPositionFlowType = Exclude<YieldFlowType, 'claim'>;
export type YieldWithdrawFlowType = Extract<YieldFlowType, 'withdraw' | 'redeem'>;
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

export type YieldFlowResolvedData = {
    account: Account;
    vault: YieldDtoV2;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
};

export type YieldFlowCompleteValue = {
    token: YieldFlowDisplayToken;
    amount: string;
};

type StablecoinYieldClaimUnsignedTransactionFee =
    | {
          gasPrice: string;
          maxFeePerGas?: never;
          maxPriorityFeePerGas?: never;
      }
    | {
          gasPrice?: never;
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
      };

export type StablecoinYieldClaimUnsignedTransaction = {
    to: EvmHexString;
    data: EvmHexString;
    chainId: number;
    gasLimit: string;
    nonce: string;
} & StablecoinYieldClaimUnsignedTransactionFee;

export type YieldApproveModalState = {
    amount: string;
    contractAddress: string;
    spender: string;
    preapprovedAmount?: string;
    txType: Extract<YieldPendingTransactionState['type'], 'approve' | 'revoke'>;
};

export type YieldPendingTransactionState = {
    type: 'approve' | 'revoke' | 'deposit' | 'withdraw' | 'redeem' | 'claim';
    txid: string;
    amount: string;
    fee?: string;
    submittedAt?: number;
    isAmountUnlimited?: boolean;
};

export type YieldFlowCompleteRewardItem = {
    token: YieldFlowDisplayToken;
    value: string;
    fiatValue?: string | null;
};
