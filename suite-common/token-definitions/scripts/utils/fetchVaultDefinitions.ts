import { NetworkSymbol } from '@suite-common/wallet-config';

import { YIELD_VAULTS_URL } from '../constants';

/**
 * Mirror of the worker's `YieldDefinitions` schema, narrowed to the keys this
 * script needs. Inlined to keep the script free of a runtime dep on
 * `@suite-common/earn-stablecoin-api`.
 */
type YieldDefinitions = Record<
    Extract<NetworkSymbol, 'eth' | 'op' | 'arb' | 'base'>,
    {
        yieldId: string;
        address: string;
    }[]
>;

/**
 * Maps a CoinGecko asset platform id (as used by this script's CLI args) to
 * the worker's vault network key. Networks not present here have no vaults.
 */
export const VAULT_NETWORK_BY_ASSET_PLATFORM: Partial<Record<string, keyof YieldDefinitions>> = {
    ethereum: 'eth',
    'arbitrum-one': 'arb',
    base: 'base',
    'optimistic-ethereum': 'op',
};

export const fetchVaultDefinitions = async (): Promise<YieldDefinitions> => {
    const response = await fetch(YIELD_VAULTS_URL, {
        headers: {
            'X-Suite-Version': 'latest',
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch vault definitions from ${YIELD_VAULTS_URL}: ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
};
