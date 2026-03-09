import { type NetworkSymbol, type StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';

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
    vaultName: string;
    tokenSymbol: TokenSymbol;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    accountKey: AccountKey | null;
    accountLabel?: Account['accountLabel'];
    tokenBalance: string | null;
    apy: number | null;
};

export type EarnPromoItem = StakingEarnItem | StablecoinYieldEarnItem;

export type EarnPromoSectionType = EarnPromoItem['type'];

export type SkeletonLoaderItem = {
    type: 'skeleton-loader';
    id: string;
};

export type EarnPromoListDataItem = EarnPromoItem | EarnPromoSectionType | SkeletonLoaderItem;

export type EarnDepositsCardActiveItem =
    | {
          id: string;
          type: 'staking';
          title: string;
          symbol: StakingNetworkSymbol;
          accountKey: AccountKey;
          balance: string;
          fiatAmount: BaseCurrencyAmount;
          apy: number | null;
      }
    | {
          id: string;
          type: 'stablecoin-yield';
          title: string;
          networkSymbol: NetworkSymbol;
          tokenSymbol: TokenSymbol;
          contractAddress: TokenAddress;
          accountKey: AccountKey;
          balance: string;
          fiatAmount: BaseCurrencyAmount;
          apy: number | null;
      };

export type EarnDepositsCardRow = {
    type: EarnPromoSectionType;
    title: string;
    activeItems: EarnDepositsCardActiveItem[];
};
