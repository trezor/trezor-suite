import type { Account, StellarTokenInfo } from '@suite-common/wallet-types';
import { STELLAR_DECIMALS, getTokenMetadata } from '@trezor/blockchain-link-stellar/src/utils';
import type { TokenDetailByMint } from '@trezor/blockchain-link-types';

/** Get the list of inactive Stellar tokens for the user account */
export const getStellarInactiveTokens = async (account: Account): Promise<StellarTokenInfo[]> => {
    if (account.symbol !== 'xlm') return [];

    const allTokens: TokenDetailByMint = await getTokenMetadata();

    // Get the currently active token contract addresses for the user
    const activeTokenContracts = new Set(account.tokens?.map(token => token.contract) || []);

    // Return tokens that the user has not activated yet
    const inactiveTokens = Object.entries(allTokens)
        .filter(([contractAddress]) => !activeTokenContracts.has(contractAddress))
        .map(([contract]) => ({
            type: 'STELLAR-CLASSIC' as const,
            standard: 'STELLAR-CLASSIC' as const,
            contract,
            name: allTokens[contract]?.name,
            symbol: contract.split('-')[0],
            decimals: STELLAR_DECIMALS,
            homeDomain: allTokens[contract]?.home_domain,
            rating: allTokens[contract]?.rating,
        }))
        .sort((a, b) => {
            // Place tokens without ratings last, otherwise sort high to low
            if (a.rating == null && b.rating == null) return 0;
            if (a.rating == null) return 1;
            if (b.rating == null) return -1;

            return b.rating - a.rating;
        });

    return inactiveTokens;
};
