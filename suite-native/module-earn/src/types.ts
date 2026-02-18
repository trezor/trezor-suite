import { NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';
import { Account, AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

export type StakingEarnItem = {
    type: 'staking';
    symbol: StakingNetworkSymbol;
    accountKey: AccountKey | null;
    accountLabel?: Account['accountLabel'];
};

export type StablecoinYieldEarnItem = {
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

export type EarnItem = StakingEarnItem | StablecoinYieldEarnItem;
