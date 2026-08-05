import { DeviceModelInternal } from '@trezor/device-utils';
import { CARDANO_DECIMALS, type CardanoNetworkSymbol } from '@trezor/network-cardano/constants';
import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asNetworkDisplaySymbol,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/address/`,
    token: `${baseUrl}/asset/`,
});

const networkConfigBySymbol: Readonly<Record<CardanoNetworkSymbol, SuiteCommonNetworkConfig>> = {
    ada: {
        color: '#3468d1',
        protocols: [asProtocol('cardano'), asProtocol('ada')],
        // icarus derivation
        displaySymbol: asNetworkDisplaySymbol('ADA'),
        name: 'Cardano',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: CARDANO_DECIMALS,
        testnet: false,
        features: ['tokens', 'staking', 'coin-definitions', 'sign-verify'],
        explorer: getExplorerUrls('https://cexplorer.io'),
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.0.0',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendOptions: [{ type: 'blockfrost' }],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation, differs from default just for 24 words seed
                accountType: 'legacy',
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
            ledger: {
                // ledger derivation
                accountType: 'ledger',
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'cardano',
        tradeCryptoId: 'cardano',
        yieldXyzId: 'cardano',
    },
};

export const getNetworkConfig = (symbol: CardanoNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
