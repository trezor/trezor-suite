import { pipe } from '@mobily/ts-belt';
import { getStoredState } from 'redux-persist';

import { NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { BaseCurrencyCode, isBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { UnknownPersistedState } from '../../createAsyncMigrate';
import { initMmkvStorage } from '../../storage';

const getFiatCurrencyCode = (appSettings: object): string => {
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

    return initialWalletSettingsState.localCurrency;
};

const migrateLocalCurrency = (appSettings: object): BaseCurrencyCode => {
    const localCurrency = getFiatCurrencyCode(appSettings);

    if (!isBaseCurrencyCode(localCurrency)) {
        return initialWalletSettingsState.localCurrency;
    }

    return localCurrency;
};

const migrateBitcoinAmountUnit = (appSettings: object): PROTO.AmountUnit => {
    if (!('bitcoinUnits' in appSettings)) {
        return PROTO.AmountUnit.BITCOIN; // TODO undefined is enough here?
    }

    const bitcoinAmountUnit = appSettings.bitcoinUnits;

    if (
        typeof bitcoinAmountUnit !== 'number' ||
        ![PROTO.AmountUnit.BITCOIN, PROTO.AmountUnit.SATOSHI].includes(bitcoinAmountUnit)
    ) {
        return PROTO.AmountUnit.BITCOIN;
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
const migrateDiscoveryConfigToWalletSettings = <T extends object>(
    discoveryConfig: T,
): NetworkSymbol[] => {
    if (!('enabledDiscoveryNetworkSymbols' in discoveryConfig)) {
        return []; // TODO: can we just return undefined and initial state will be used?
    }

    if (!Array.isArray(discoveryConfig.enabledDiscoveryNetworkSymbols)) {
        return [];
    }

    return pipe(
        discoveryConfig.enabledDiscoveryNetworkSymbols,
        migrateBscNetworkSymbol,
        filterUnknownNetworkSymbols,
    );
};

export const migrateAppSettingsAndDiscoveryConfig = async (walletSettingsState: unknown) => {
    // This is supposed to be initial migration from empty state.
    if (typeof walletSettingsState !== 'undefined') return walletSettingsState;

    const storage = await initMmkvStorage();
    const appSettings = await getStoredState({
        key: 'appSettings',
        storage,
    });
    const discoveryConfig = await getStoredState({
        key: 'discoveryConfig',
        storage,
    });

    if (appSettings && discoveryConfig) {
        const localCurrency = migrateLocalCurrency(appSettings);
        const bitcoinAmountUnit = migrateBitcoinAmountUnit(appSettings);
        const enabledNetworks = migrateDiscoveryConfigToWalletSettings(discoveryConfig);

        // TODO: are other properties from initial state missing?
        return {
            localCurrency,
            enabledNetworks,
            bitcoinAmountUnit,
        } as UnknownPersistedState<WalletSettings>;
    }

    return undefined;
};
