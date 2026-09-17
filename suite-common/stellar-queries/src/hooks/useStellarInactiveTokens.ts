import { useMemo } from 'react';

import { type Account, type StellarTokenInfo } from '@suite-common/wallet-types';
import {
    getStellarActiveTokenContracts,
    getStellarInactiveTokens,
} from '@suite-common/wallet-utils';

import { stellarTokenMetadataQuery } from '../queries';

const EMPTY_TOKENS: StellarTokenInfo[] = [];

interface UseStellarInactiveTokensParams {
    /** `null` is what the account selectors answer with, so it is accepted as "no account". */
    account?: Pick<Account, 'symbol' | 'tokens'> | null;
    /**
     * The tokens to consider. Defaults to everything the published definitions describe; mobile
     * passes the coin definitions it already holds in the store instead.
     */
    contracts?: readonly string[];
}

/** The tokens the account could still activate, best-rated first. */
export const useStellarInactiveTokens = ({
    account,
    contracts,
}: UseStellarInactiveTokensParams) => {
    const isStellarAccount = account?.symbol === 'xlm';

    const {
        data: tokenMetadata,
        isLoading,
        isError,
        refetch,
    } = stellarTokenMetadataQuery.use(undefined, { enabled: isStellarAccount });

    const accountTokens = account?.tokens;

    const inactiveTokens = useMemo(() => {
        const candidates = contracts ?? (tokenMetadata && Object.keys(tokenMetadata));

        if (!isStellarAccount || !candidates) return EMPTY_TOKENS;

        return getStellarInactiveTokens({
            contracts: candidates,
            activeContracts: getStellarActiveTokenContracts({ tokens: accountTokens }),
            tokenMetadata,
        });
    }, [accountTokens, contracts, isStellarAccount, tokenMetadata]);

    return { inactiveTokens, isLoading, isError, refetch };
};
