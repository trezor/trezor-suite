import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type YieldAccountRewards = {
    account: { symbol: NetworkSymbol };
    rewards: readonly { token: { address: string; symbol: string; decimals: number } }[];
};

export const yieldAccountRewardsToTokenMetadataSources = (
    accountRewards: YieldAccountRewards | null | undefined,
): TokenMetadataSource[] => {
    if (!accountRewards) return [];

    return [
        {
            networkSymbol: accountRewards.account.symbol,
            tokens: accountRewards.rewards.map(({ token }) => ({
                contract: toTokenAddress(token.address),
                symbol: token.symbol,
                decimals: token.decimals,
            })),
        },
    ];
};
