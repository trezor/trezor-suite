import { parseElectrumUrl } from '@trezor/utils';
import type {
    CustomBackend,
    BlockchainNetworks,
    BackendSettings,
    Account,
} from '@suite-common/wallet-types';
import {
    TREZOR_CONNECT_BACKENDS,
    BackendType,
    NetworkSymbol,
    getNetworkType,
} from '@suite-common/wallet-config';

export const getDefaultBackendType = (coin: NetworkSymbol) => {
    if (coin === 'ada' || coin === 'tada') {
        return 'blockfrost';
    }
    if (coin === 'sol' || coin === 'dsol') {
        return 'solana';
    }

    return 'blockbook';
};

export const getBackendFromSettings = (
    coin: NetworkSymbol,
    settings?: BackendSettings,
): CustomBackend => {
    const type = settings?.selected ?? getDefaultBackendType(coin);
    const urls = (settings?.selected && settings?.urls?.[type]) ?? [];

    return {
        coin,
        type,
        urls,
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

export const isElectrumUrl = (value: string) => !!parseElectrumUrl(value);

// check if account.backendType or NETWORK.accountType.backendType is supported by TrezorConnect api (defined in TREZOR_CONNECT_BACKENDS)
// if it's not then different (non-standard) api should be used for fetching data
export const isTrezorConnectBackendType = (type?: BackendType) => {
    if (!type) return true; // use TrezorConnect by default if not defined

    return !!TREZOR_CONNECT_BACKENDS.find(b => b === type);
};

export const shouldUseIdentities = (symbol: NetworkSymbol) => getNetworkType(symbol) === 'ethereum';

export const getAccountIdentity = (account: Pick<Account, 'deviceState'>) => account.deviceState;

export const tryGetAccountIdentity = (account: Pick<Account, 'networkType' | 'deviceState'>) =>
    account.networkType === 'ethereum' ? getAccountIdentity(account) : undefined;
