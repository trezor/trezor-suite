import type {
    CustomBackend,
    BlockchainNetworks,
    BackendSettings,
} from '@suite-common/wallet-types';
import { TREZOR_CONNECT_BACKENDS, BackendType, NetworkSymbol } from '@suite-common/wallet-config';

export const getDefaultBackendType = (coin: NetworkSymbol) => {
    if (coin === 'ada' || coin === 'tada') {
        return 'blockfrost';
    }
    return 'blockbook';
};

export const getBackendFromSettings = (
    coin: NetworkSymbol,
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

export const getCustomBackends = (blockchains: BlockchainNetworks): CustomBackend[] =>
    Object.entries(blockchains)
        .map(([coin, { backends }]) => ({
            coin: coin as NetworkSymbol,
            type: backends.selected,
            urls: backends.selected && backends.urls?.[backends.selected],
        }))
        .filter(isBackend);

const electrumUrlRegex = /^([a-zA-Z0-9.-]+):[0-9]{1,5}:[ts]$/; // URL is in format host:port:[t|s] (t for tcp, s for ssl)

export const isElectrumUrl = (value: string) => electrumUrlRegex.test(value);

// check if account.backendType or NETWORK.accountType.backendType is supported by TrezorConnect api (defined in TREZOR_CONNECT_BACKENDS)
// if it's not then different (non-standard) api should be used for fetching data
export const isTrezorConnectBackendType = (type?: BackendType) => {
    if (!type) return true; // use TrezorConnect by default if not defined
    return !!TREZOR_CONNECT_BACKENDS.find(b => b === type);
};
