import { pipe } from '@mobily/ts-belt';
import { getStoredState } from 'redux-persist';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { WalletSettings } from '@suite-common/wallet-types';

import { initMmkvStorage } from '../../storage';

type NetworkSymbolOld = Exclude<NetworkSymbol, 'bsc'> | 'bnb';

const migrateEnabledDiscoveryNetworkSymbols = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    (oldEnabledDiscoveryNetworkSymbols as NetworkSymbolOld[]).map(networkSymbol =>
        networkSymbol === 'bnb' ? 'bsc' : networkSymbol,
    );

// @ts-expect-error
const deprecatedNetworks: NetworkSymbol[] = ['dash', 'btg', 'nmc', 'vtc', 'dgb'];

const migrateDiscoveryDeprecateNetworks = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    oldEnabledDiscoveryNetworkSymbols.filter(
        networkSymbol => !deprecatedNetworks.includes(networkSymbol),
    );

/**
 * Migration of discoveryConfig slice, which was declared locally in suite-native,
 * to the walletSettings reducer shared in suite-common.
 * All migrations that were done on discoveryConfig are moved here
 */
const migrateDiscoveryConfigToWalletSettings = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    pipe(
        oldEnabledDiscoveryNetworkSymbols,
        migrateEnabledDiscoveryNetworkSymbols,
        migrateDiscoveryDeprecateNetworks,
    );

export const migrateAppSettingsAndDiscoveryConfig = async (
    walletSettingsState: WalletSettings,
): Promise<WalletSettings> => {
    const storage = await initMmkvStorage();
    const appSettings = (await getStoredState({
        key: 'appSettings',
        storage,
    })) as any;
    const discoveryConfig = (await getStoredState({
        key: 'discoveryConfig',
        storage,
    })) as any;

    if (appSettings && discoveryConfig) {
        const enabledNetworks = migrateDiscoveryConfigToWalletSettings(
            discoveryConfig.enabledDiscoveryNetworkSymbols,
        );

        return {
            ...walletSettingsState,
            localCurrency: appSettings.fiatCurrencyCode,
            enabledNetworks,
            bitcoinAmountUnit: appSettings.bitcoinUnits,
        };
    }

    return walletSettingsState;
};
