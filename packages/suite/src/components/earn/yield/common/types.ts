import type { CryptoId, DexApprovalType } from 'invity-api';

import type { TranslationKey } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AllowanceType } from '@suite-common/wallet-types';

export type YieldFlowFormValues = {
    amountInput: string;
};

export type YieldFlowDisplayToken = {
    networkSymbol: NetworkSymbol;
    symbol: string;
    decimals: number;
    contractAddress?: string;
    coingeckoId?: string;
};

export type YieldFlowCompleteValue = {
    token: YieldFlowDisplayToken;
    value: string;
};

export type YieldFlowActionStep = {
    approvedAmount: string;
    amountError?: string | null;
    isApprovedUnlimited: boolean;
    isDisabled?: boolean;
    maxAmount: string;
};

export const yieldSupplyStepIds = ['approve', 'supply', 'complete'] as const;

export type YieldSupplyStepId = (typeof yieldSupplyStepIds)[number];

export type YieldSupplyFlowState = {
    step: YieldSupplyStepId;
    amount: string;
};

export type YieldFlowToken = YieldFlowDisplayToken & {
    contractAddress: string;
    providerId: string;
    vaultName: string;
    approvalSpender: string | null;
    balance: string;
};

export type YieldSupplyFormValues = YieldFlowFormValues;

export type YieldSupplyAvailableToken = YieldFlowToken;

export type YieldSupplyFlow = {
    amount: string;
    cryptoId: CryptoId | null;
    currentStepIndex: number;
    isCompleteStep: boolean;
};

export type YieldSupplyCompleteValue = YieldFlowCompleteValue;

export type YieldSupplyComplete = {
    input: YieldSupplyCompleteValue;
    output: YieldSupplyCompleteValue;
};

export type YieldSupplyApproveStep = {
    amountError?: string | null;
};

export type YieldSupplyApprove = {
    error?: TranslationKey | null;
    isAmountInputDisabled?: boolean;
    isApproveButtonDisabled?: boolean;
    isApproveButtonLoading?: boolean;
};

export type YieldSupplyApproval = {
    isPending?: boolean;
    isRevokeRequired?: boolean;
    pendingType?: AllowanceType | null;
    selectedType: DexApprovalType;
    spender: string | null;
    txid?: string | null;
};

export type YieldSupplyStep = YieldFlowActionStep;

export type UseYieldSupplyFlowResult = {
    flow: YieldSupplyFlow;
    approveStep: YieldSupplyApproveStep;
    supplyStep: YieldSupplyStep;
    approve: YieldSupplyApprove;
    approval: YieldSupplyApproval;
    complete: YieldSupplyComplete;
    completeSupply: () => void;
    handleAmountChange: (amount: string) => void;
    handleApprove: () => Promise<void>;
    handleApproveModalConfirm: () => void;
    handleSelectApprovalType: (approvalType: DexApprovalType) => void;
    handleRevoke: () => void;
};

export const yieldWithdrawStepIds = ['approve', 'withdraw', 'complete'] as const;

export type YieldWithdrawStepId = (typeof yieldWithdrawStepIds)[number];

export type YieldWithdrawUnit = 'asset' | 'receiptToken';

export type YieldWithdrawToken = YieldFlowDisplayToken & {
    contractAddress: string;
    providerId: string;
    vaultName: string;
    approvalSpender: string | null;
};

export type YieldWithdrawReceiptToken = YieldFlowDisplayToken;

export type YieldWithdrawFormValues = YieldFlowFormValues;

export type YieldWithdrawApproveAmount = {
    assetValue: string;
    receiptTokenValue: string;
    selectedUnit: YieldWithdrawUnit;
};

export type YieldWithdrawFlowState = {
    step: YieldWithdrawStepId;
    approveAmount: YieldWithdrawApproveAmount;
    withdrawAmount: string;
};

export type YieldWithdrawFlow = {
    approveAmount: YieldWithdrawApproveAmount;
    withdrawAmount: string;
    cryptoId: CryptoId | null;
    currentStepIndex: number;
    isCompleteStep: boolean;
};

export type YieldWithdrawApproveStep = {
    amountError?: string | null;
};

export type YieldWithdrawApprove = {
    error?: TranslationKey | null;
    isAmountInputDisabled?: boolean;
    isApproveButtonDisabled?: boolean;
    isApproveButtonLoading?: boolean;
};

export type YieldWithdrawApproval = {
    isPending?: boolean;
    isRevokeRequired?: boolean;
    pendingType?: AllowanceType | null;
    selectedType: DexApprovalType;
    spender: string | null;
    txid?: string | null;
};

export type YieldWithdrawStep = YieldFlowActionStep;

export type YieldWithdrawComplete = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
};

export type UseYieldWithdrawFlowResult = {
    flow: YieldWithdrawFlow;
    approveStep: YieldWithdrawApproveStep;
    withdrawStep: YieldWithdrawStep;
    approve: YieldWithdrawApprove;
    approval: YieldWithdrawApproval;
    complete: YieldWithdrawComplete;
    completeWithdraw: () => void;
    handleApproveAmountChange: (amount: string) => void;
    handleApprove: () => Promise<void>;
    handleApproveModalConfirm: () => void;
    handleSelectApprovalType: (approvalType: DexApprovalType) => void;
    handleRevoke: () => void;
    handleSwitchUnit: () => void;
    handleWithdrawAmountChange: (amount: string) => void;
};
