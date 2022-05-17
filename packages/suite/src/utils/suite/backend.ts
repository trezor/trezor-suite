import type { Network, CustomBackend } from '@wallet-types';
import type { BlockchainState, BackendSettings } from '@wallet-reducers/blockchainReducer';

export const getDefaultBackendType = (coin: Network['symbol']) => {
    if (coin === 'ada' || coin === 'tada') {
        return 'blockfrost';
    }
    return 'blockbook';
};

export const getBackendFromSettings = (
    coin: Network['symbol'],
    settings?: BackendSettings,
): CustomBackend => {
    const type = settings?.selected ?? getDefaultBackendType(coin);
    return {
        coin,
        type,
        urls: settings?.urls?.[type] ?? [],
    };
};

const isBackend = (backend: Partial<CustomBackend>): backend is CustomBackend =>
    !!(backend.type && backend.urls?.length);

export const getCustomBackends = (blockchains: BlockchainState): CustomBackend[] =>
    Object.entries(blockchains)
        .map(([coin, { backends }]) => ({
            coin: coin as Network['symbol'],
            type: backends.selected,
            urls: backends.selected && backends.urls?.[backends.selected],
        }))
        .filter(isBackend);

const electrumUrlRegex = /^([a-zA-Z0-9.-]+):[0-9]{1,5}:[ts]$/; // URL is in format host:port:[t|s] (t for tcp, s for ssl)

export const isElectrumUrl = (value: string) => electrumUrlRegex.test(value);
