import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface YieldOpportunity extends YieldDtoV2 {}

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

export type YieldClaimToken = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    symbol: TokenSymbol;
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

export type YieldClaimVault = {
    name: string;
    tokenContract: TokenAddress;
};

export type YieldClaimAccountItem = {
    summary: YieldClaimListItem;
    vaults: YieldClaimVault[];
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
