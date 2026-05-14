import { pipe } from '@mobily/ts-belt';
import { type PersistedState, type getStoredState } from 'redux-persist';

import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletSettings } from '@suite-common/wallet-types';
import { type BaseCurrencyCode, isBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import { type MMKVStorageDep } from '../../mmkvStorage';

const getFiatCurrencyCode = (appSettings: object): string | undefined => {
    if ('fiatCurrencyCode' in appSettings && typeof appSettings.fiatCurrencyCode === 'string') {
        return appSettings.fiatCurrencyCode;
    }

    if (
        'fiatCurrency' in appSettings &&
        typeof appSettings.fiatCurrency === 'object' &&
        appSettings.fiatCurrency !== null &&
        'label' in appSettings.fiatCurrency &&
        typeof appSettings.fiatCurrency.label === 'string'
    ) {
        return appSettings.fiatCurrency.label;
    }

    return undefined;
};

const migrateLocalCurrency = (appSettings: object): BaseCurrencyCode | undefined => {
    const localCurrency = getFiatCurrencyCode(appSettings);

    if (!localCurrency || !isBaseCurrencyCode(localCurrency)) return undefined;

    return localCurrency;
};

const migrateBitcoinAmountUnit = (appSettings: object): PROTO.AmountUnit | undefined => {
    if (!('bitcoinUnits' in appSettings)) return undefined;

    const bitcoinAmountUnit = appSettings.bitcoinUnits;

    if (
        typeof bitcoinAmountUnit !== 'number' ||
        // only BTC or SATS are supported
        ![PROTO.AmountUnit.BITCOIN, PROTO.AmountUnit.SATOSHI].includes(bitcoinAmountUnit)
    ) {
        return undefined;
    }

    return bitcoinAmountUnit;
};

const migrateBscNetworkSymbol = (oldEnabledDiscoveryNetworkSymbols: string[]): string[] =>
    oldEnabledDiscoveryNetworkSymbols.map(networkSymbol =>
        networkSymbol === 'bnb' ? 'bsc' : networkSymbol,
    );

const filterUnknownNetworkSymbols = (networkSymbols: string[]): NetworkSymbol[] =>
    networkSymbols.filter(networkSymbol => isNetworkSymbol(networkSymbol));

/**
 * Migration of discoveryConfig slice, which was declared locally in suite-native,
 * to the walletSettings reducer shared in suite-common.
 * All migrations that were done on discoveryConfig are moved here
 */
const migrateDiscoveryConfigToWalletSettings = (
    discoveryConfig: object,
): NetworkSymbol[] | undefined => {
    if (!('enabledDiscoveryNetworkSymbols' in discoveryConfig)) {
        return undefined;
    }

    if (!Array.isArray(discoveryConfig.enabledDiscoveryNetworkSymbols)) {
        return undefined;
    }

    return pipe(
        discoveryConfig.enabledDiscoveryNetworkSymbols,
        migrateBscNetworkSymbol,
        filterUnknownNetworkSymbols,
    );
};

export type MigrationDeps = MMKVStorageDep & {
    getStoredState: typeof getStoredState;
};

export const initialMigrateAppSettingsAndDiscoveryConfig =
    (deps: MigrationDeps) => async (walletSettingsState: unknown) => {
        const appSettings = await deps.getStoredState({
            key: 'appSettings',
            storage: deps.mmkvStorage,
        });
        const discoveryConfig = await deps.getStoredState({
            key: 'discoveryConfig',
            storage: deps.mmkvStorage,
        });

        const newState = walletSettingsState as Partial<WalletSettings> & PersistedState;

        if (!appSettings && !discoveryConfig) return newState;

        if (appSettings) {
            const localCurrency = migrateLocalCurrency(appSettings);
            const bitcoinAmountUnit = migrateBitcoinAmountUnit(appSettings);

            if (localCurrency) {
                newState.localCurrency = localCurrency;
            }
            if (bitcoinAmountUnit) {
                newState.bitcoinAmountUnit = bitcoinAmountUnit;
            }
        }

        if (discoveryConfig) {
            const enabledNetworks = migrateDiscoveryConfigToWalletSettings(discoveryConfig);

            if (enabledNetworks) {
                newState.enabledNetworks = enabledNetworks;
            }
        }

        return newState;
    };
