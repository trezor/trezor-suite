import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type StablecoinYieldAccountRewards } from '@suite-common/wallet-core';

export const yieldAccountRewardsToTokenMetadataSources = (
    accountRewards: StablecoinYieldAccountRewards | null,
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
