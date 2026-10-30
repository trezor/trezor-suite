import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
    type StakeLiveStateInvalidError,
} from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { type BottomSheetModalRef } from '@suite-native/atoms';
import { type StakingPendingTxParams } from '@suite-native/navigation';

export type EarnType = 'staking' | 'yield';

export type EarnFormDraftPrefix = 'stake' | 'unstake' | 'claim';

export type SignStakeTransactionRejectValue =
    SignTransactionError | SignTransactionTimeoutError | StakeLiveStateInvalidError | undefined;

export type StakingPendingModal = {
    bottomSheetRef: BottomSheetModalRef;
    isExploreDisabled: boolean;
    onExplorePress: () => void;
    pendingTransaction: StakingPendingTxParams;
};

export type YieldApprovalLimitType = 'per-deposit' | 'unlimited';

export type YieldAllowanceFormDraftTransactionType = 'approve' | 'revoke';

export type YieldReviewActionStatus = 'idle' | 'signing' | 'sending';

export type YieldReviewStatus = YieldReviewActionStatus | 'signed';

export type YieldReviewSigningResult =
    'signed' | 'cancelled' | 'failed' | 'not-ready' | 'already-running';

export type YieldBroadcastTransaction = {
    txid: string;
    fee?: string;
};

export type YieldNavigationItem = {
    yieldId: string;
    underlyingTokenContract: TokenAddress;
    receiptTokenContract: TokenAddress | null;
};

export type ChooseAccountTokenBalance = {
    tokenContractAddress: TokenAddress;
    tokenDecimals?: number;
    tokenSymbol: TokenSymbol;
};
