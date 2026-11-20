import { type TokenMetadataSource } from '@suite-common/token';
import { type Account } from '@suite-common/wallet-types';

import { type ChooseAccountTokenBalance } from '../../types';

export const chooseAccountTokenBalanceToTokenMetadataSources = (
    accounts: readonly Account[],
    tokenBalance: ChooseAccountTokenBalance | undefined,
): TokenMetadataSource[] => {
    if (!tokenBalance) return [];

    const networkSymbols = new Set(accounts.map(account => account.symbol));

    return [...networkSymbols].map(networkSymbol => ({
        networkSymbol,
        tokens: [
            {
                contract: tokenBalance.tokenContractAddress,
                symbol: tokenBalance.tokenSymbol,
                decimals: tokenBalance.tokenDecimals,
            },
        ],
    }));
};
