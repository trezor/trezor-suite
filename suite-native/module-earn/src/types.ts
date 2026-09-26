import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
    type StakeLiveStateInvalidError,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { type YieldClaimVaultParams } from '@suite-native/navigation';

export type EarnType = 'staking' | 'yield';

export type EarnFormDraftPrefix = 'stake' | 'unstake' | 'claim';

export type SignStakeTransactionRejectValue =
    SignTransactionError | SignTransactionTimeoutError | StakeLiveStateInvalidError | undefined;

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

export type YieldClaimToken = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    symbol: TokenSymbol;
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

export type StakingListItem = {
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    balance: string;
};

export type YieldListItem = {
    id: string;
    yieldId: string;
    vaultName: string;
    tokenSymbol: TokenSymbol;
    networkSymbol: NetworkSymbol;
    underlyingTokenContract: TokenAddress;
    receiptTokenContract: TokenAddress | null;
    contractAddress: TokenAddress;
    tokenContractAddress: TokenAddress;
    apy: number | null;
    token?: YieldDtoV2['token'];
    outputToken?: YieldDtoV2['outputToken'];
    pricePerShareState?: NonNullable<YieldDtoV2['state']>['pricePerShareState'];
    accountKey: AccountKey;
    tokenBalance: string;
};

export type YieldListItemWithAccount = {
    item: YieldListItem;
    account: Account;
};

export type YieldListVaultIcon = {
    networkSymbol: NetworkSymbol;
    tokenSymbol: TokenSymbol;
    tokenContractAddress: TokenAddress;
};

export type YieldClaimRewardToken = YieldClaimToken & {
    claimableAmount: string;
    decimals: number;
};

export type YieldClaimListItem = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    claimableRewardsCount: number;
    fiatClaimableAmount: BaseCurrencyAmount | null;
    tokens: YieldClaimRewardToken[];
};

export type YieldClaimAccountItem = {
    summary: YieldClaimListItem;
    vaults: YieldClaimVaultParams[];
};

export type YieldPromoListItem = {
    id: string;
    yieldId: string;
    vaultName: string;
    tokenSymbol: TokenSymbol;
    networkSymbol: NetworkSymbol;
    underlyingTokenContract: TokenAddress;
    receiptTokenContract: TokenAddress | null;
    contractAddress: TokenAddress;
    tokenContractAddress: TokenAddress;
    apy: number | null;
    token?: YieldDtoV2['token'];
    outputToken?: YieldDtoV2['outputToken'];
    pricePerShareState?: NonNullable<YieldDtoV2['state']>['pricePerShareState'];
};
