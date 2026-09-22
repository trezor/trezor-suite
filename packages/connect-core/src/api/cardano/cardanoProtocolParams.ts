import type { CoreEventMessage } from '@trezor/connect-common';
import type { types } from '@trezor/network-cardano/types';
import { typedObjectKeys } from '@trezor/utils';

import type { Blockchain } from '../../backend/Blockchain';
import { assertBackendSupported, initBlockchain } from '../../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../../data/coinInfo';

type ProtocolParams = types.ProtocolParams;
type LiveProtocolParams = Awaited<ReturnType<Blockchain['getCardanoProtocolParameters']>>;

// Protocol parameters change only at epoch boundaries (five days on mainnet). A short cache
// avoids a backend round trip for every recomposition while the user edits the send form.
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { protocolParams: ProtocolParams; fetchedAt: number };

const cache = new Map<string, CacheEntry>();

export const clearCardanoProtocolParamsCache = () => cache.clear();

export type GetCardanoProtocolParamsParams = {
    testnet: boolean;
    postMessage: (message: CoreEventMessage) => void;
    /** Compiled-in values used when the backend is unavailable or omits a field. */
    defaults: ProtocolParams;
};

// Blockfrost reports coins_per_utxo_size and max_val_size as nullable for pre-Babbage eras.
const mergeWithDefaults = (live: LiveProtocolParams, defaults: ProtocolParams): ProtocolParams => ({
    minFeeA: live.minFeeA,
    minFeeB: live.minFeeB,
    keyDeposit: live.keyDeposit,
    poolDeposit: live.poolDeposit,
    coinsPerUtxoByte: live.coinsPerUtxoByte ?? defaults.coinsPerUtxoByte,
    maxValueSize: live.maxValueSize ?? defaults.maxValueSize,
    maxTxSize: live.maxTxSize,
});

const reportDrift = (protocolParams: ProtocolParams, defaults: ProtocolParams) => {
    const driftedKeys = typedObjectKeys(defaults).filter(
        key => protocolParams[key] !== defaults[key],
    );

    if (driftedKeys.length > 0) {
        // Protocol parameters are public chain data, so logging them leaks nothing about the
        // account. The compiled-in defaults should be updated once this appears.
        console.warn(
            'Cardano protocol parameters differ from the compiled-in defaults:',
            Object.fromEntries(
                driftedKeys.map(key => [
                    key,
                    { live: protocolParams[key], default: defaults[key] },
                ]),
            ),
        );
    }
};

/**
 * Resolves the protocol parameters used to compose a Cardano transaction. Live values come from
 * the Blockfrost backend and fall back to the compiled-in defaults when no backend is configured
 * for the network (e.g. testnet) or the backend call fails.
 */
export const getCardanoProtocolParams = async ({
    testnet,
    postMessage,
    defaults,
}: GetCardanoProtocolParamsParams): Promise<ProtocolParams> => {
    const coinInfo = getCoinInfoOrThrow(testnet ? 'tada' : 'ada');

    try {
        assertBackendSupported(coinInfo);
    } catch {
        return defaults;
    }

    const cached = cache.get(coinInfo.shortcut);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.protocolParams;
    }

    try {
        const backend = await initBlockchain(coinInfo, postMessage);
        const live = await backend.getCardanoProtocolParameters();
        const protocolParams = mergeWithDefaults(live, defaults);

        cache.set(coinInfo.shortcut, { protocolParams, fetchedAt: Date.now() });
        reportDrift(protocolParams, defaults);

        return protocolParams;
    } catch (error) {
        console.warn(
            'Cardano protocol parameters could not be fetched, using compiled-in defaults:',
            error instanceof Error ? error.message : error,
        );

        return defaults;
    }
};
