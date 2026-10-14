import { isCodesignBuild } from '@trezor/env-utils';

import {
    TOKEN_DEFINITIONS_PREFIX_URL,
    TOKEN_DEFINITIONS_SUFFIX_URL,
} from './tokenDefinitionsConstants';
import { type RankedTokenStructure } from './tokenDefinitionsTypes';

const isRankedToken = (token: unknown): token is RankedTokenStructure[number] =>
    typeof token === 'object' &&
    token !== null &&
    'assetPlatformId' in token &&
    typeof token.assetPlatformId === 'string' &&
    'address' in token &&
    typeof token.address === 'string' &&
    'symbol' in token &&
    typeof token.symbol === 'string' &&
    'name' in token &&
    typeof token.name === 'string' &&
    'marketCap' in token &&
    typeof token.marketCap === 'number' &&
    Number.isFinite(token.marketCap) &&
    token.marketCap >= 0;

/** Fetches the wallet-independent catalogue in its published market-cap order. */
export const fetchRankedTokenDefinitions = async ({
    signal,
}: { signal?: AbortSignal } = {}): Promise<RankedTokenStructure> => {
    const environment = isCodesignBuild() ? 'stable' : 'develop';
    const response = await fetch(
        `${TOKEN_DEFINITIONS_PREFIX_URL}/${environment}/ranked.coin.${TOKEN_DEFINITIONS_SUFFIX_URL}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch ranked token definitions: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.length === 0 || !data.every(isRankedToken)) {
        throw new Error('Invalid ranked token definitions');
    }

    return data;
};
