import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type EarnDashboardType } from '@suite-common/message-system';
import { type NetworkSymbol, type StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';

type YieldPricePerShareState = NonNullable<YieldDtoV2['state']>['pricePerShareState'];

export type EarnFormDraftPrefix = 'stake' | 'unstake' | 'claim';

export type YieldApprovalLimitType = 'per-deposit' | 'unlimited';

export type YieldAllowanceFormDraftTransactionType = 'approve' | 'revoke';

export type YieldReviewActionStatus = 'idle' | 'signing' | 'sending';

export type YieldReviewStatus = YieldReviewActionStatus | 'signed';

export type YieldDepositReviewStatus = YieldReviewStatus;

export type YieldReviewSigningResult =
    'signed' | 'cancelled' | 'failed' | 'not-ready' | 'already-running';

export type YieldBroadcastTransaction = {
    txid: string;
    fee?: string;
};

export type StakingEarnItem = {
    id: string;
    type: 'staking';
    symbol: StakingNetworkSymbol;
    accountKey: AccountKey | null;
    accountLabel?: Account['accountLabel'];
    balance: string | null;
};

export type YieldEarnItem = {
    id: string;
    type: 'stablecoin-yield';
    yieldId: string;
    vaultName: string;
    tokenSymbol: TokenSymbol;
    networkSymbol: NetworkSymbol;
    underlyingTokenContract: TokenAddress;
    receiptTokenContract: TokenAddress | null;
    contractAddress: TokenAddress;
    tokenContractAddress: TokenAddress;
    accountKey: AccountKey | null;
    accountLabel?: Account['accountLabel'];
    tokenBalance: string | null;
    apy: number | null;
    token?: YieldDtoV2['token'];
    outputToken?: YieldDtoV2['outputToken'];
    pricePerShareState?: YieldPricePerShareState;
};

export type YieldClaimSummary = {
    type: 'stablecoin-yield';
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    claimableRewardsCount: number;
    fiatClaimableAmount: BaseCurrencyAmount | null;
    tokens: YieldClaimRewardToken[];
};

export type YieldClaimToken = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    symbol: TokenSymbol;
};

export type YieldClaimRewardToken = YieldClaimToken & {
    claimableAmount: string;
    decimals: number;
};

export type YieldNavigationItem = Pick<
    YieldEarnItem,
    'yieldId' | 'underlyingTokenContract' | 'receiptTokenContract'
>;

export type YieldPromoNavigationItem = YieldNavigationItem &
    Pick<YieldEarnItem, 'networkSymbol' | 'tokenSymbol'>;

export type ChooseAccountTokenBalance = {
    tokenContractAddress: TokenAddress;
    tokenSymbol: TokenSymbol;
};

export type EarnPromoItem = StakingEarnItem | YieldEarnItem;

export type EarnPromoSectionType = EarnPromoItem['type'];

export type SkeletonLoaderItem = {
    type: 'skeleton-loader';
    id: string;
};

export type YieldLoadErrorListItem = {
    type: 'stablecoin-yield-load-error';
    id: string;
};

export type EarnProvider = 'everstake' | 'morpho';

export type EarnProviderListItem = {
    type: 'provider';
    id: string;
    provider: EarnProvider;
};

export type EarnStakingProvidersInfoListItem = {
    type: 'staking-providers-info';
    id: string;
};

export type EarnDashboardDisabledListItem = {
    type: 'dashboard-disabled';
    id: string;
    dashboardType: EarnDashboardType;
};

export type EarnPromoListDataItem =
    | EarnPromoItem
    | EarnPromoSectionType
    | SkeletonLoaderItem
    | YieldLoadErrorListItem
    | EarnProviderListItem
    | EarnStakingProvidersInfoListItem
    | EarnDashboardDisabledListItem;

export type EarnDepositsCardActiveItem =
    | {
          id: string;
          type: 'staking';
          title: string;
          symbol: StakingNetworkSymbol;
          accountKey: AccountKey;
          balance: string;
          fiatAmount: BaseCurrencyAmount;
      }
    | {
          id: string;
          type: 'stablecoin-yield';
          title: string;
          networkSymbol: NetworkSymbol;
          tokenSymbol: TokenSymbol;
          contractAddress: TokenAddress;
          tokenContractAddress: TokenAddress;
          accountKey: AccountKey;
          accountLabel?: string;
          balance: string;
          fiatAmount: BaseCurrencyAmount;
          apy: number | null;
      };

export type YieldPositionItem = Extract<EarnDepositsCardActiveItem, { type: 'stablecoin-yield' }>;

export type EarnDepositsCardRow = {
    type: EarnPromoSectionType;
    title: string;
    activeItems: EarnDepositsCardActiveItem[];
};
