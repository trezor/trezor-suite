import { type NetworkSymbol, type StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';

export type EarnFormDraftPrefix = 'stake' | 'unstake' | 'claim';

export type YieldApprovalLimitType = 'per-deposit' | 'unlimited';

export type YieldAllowanceFormDraftTransactionType = 'approve' | 'revoke';

export type YieldDepositReviewStatus = 'idle' | 'signing' | 'sending' | 'signed';

export type YieldReviewSigningResult =
    | 'signed'
    | 'cancelled'
    | 'failed'
    | 'not-ready'
    | 'already-running';

export type StakingEarnItem = {
    id: string;
    type: 'staking';
    symbol: StakingNetworkSymbol;
    accountKey: AccountKey | null;
    accountLabel?: Account['accountLabel'];
    balance: string | null;
};

export type StablecoinYieldEarnItem = {
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
};

export type StablecoinYieldNavigationItem = Pick<
    StablecoinYieldEarnItem,
    'yieldId' | 'underlyingTokenContract' | 'receiptTokenContract'
>;

export type StablecoinYieldPromoNavigationItem = StablecoinYieldNavigationItem &
    Pick<StablecoinYieldEarnItem, 'networkSymbol'>;

export type EarnPromoItem = StakingEarnItem | StablecoinYieldEarnItem;

export type EarnPromoSectionType = EarnPromoItem['type'];

export type SkeletonLoaderItem = {
    type: 'skeleton-loader';
    id: string;
};

export type EarnProvider = 'everstake' | 'morpho';

export type EarnProviderListItem = {
    type: 'provider';
    id: string;
    provider: EarnProvider;
};

export type EarnPromoListDataItem =
    | EarnPromoItem
    | EarnPromoSectionType
    | SkeletonLoaderItem
    | EarnProviderListItem;

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

export type EarnDepositsCardRow = {
    type: EarnPromoSectionType;
    title: string;
    activeItems: EarnDepositsCardActiveItem[];
};
