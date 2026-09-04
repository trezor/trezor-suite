import { DeviceModelInternal } from '@trezor/device-utils';
import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asNetworkDisplaySymbol,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import { TRON_DECIMALS, type TronNetworkSymbol } from '@trezor/network-tron/constants';

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/transaction/`,
    address: `${baseUrl}/address/`,
    nft: `${baseUrl}/contract/`, // Should be trc721, trc1155 instead of contract.
    token: `${baseUrl}/contract/`, // Should be trc10, trc20 instead of contract.
});

const networkConfigBySymbol: Readonly<Record<TronNetworkSymbol, SuiteCommonNetworkConfig>> = {
    trx: {
        color: '#ec002a',
        protocols: [asProtocol('tron'), asProtocol('trx')],
        displaySymbol: asNetworkDisplaySymbol('TRX'),
        name: 'Tron',
        networkType: 'tron',
        bip43Path: "m/44'/195'/0'/0/i",
        decimals: TRON_DECIMALS,
        testnet: false,
        features: ['tokens', 'coin-definitions', 'graph', 'nfts', 'staking'],
        explorer: getExplorerUrls('https://tronscan.org'),
        support: {
            [DeviceModelInternal.T2T1]: '2.11.0',
            [DeviceModelInternal.T2B1]: '2.11.0',
            [DeviceModelInternal.T3B1]: '2.11.0',
            [DeviceModelInternal.T3T1]: '2.11.0',
            [DeviceModelInternal.T3W1]: '2.11.0',
        },
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/195'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'tron',
        tradeCryptoId: 'tron',
        yieldXyzId: 'tron',
        caipId: 'tron:0x2b6653dc',
    },
    ttrx: {
        color: '#ec002a',
        protocols: [asProtocol('ttrx')],
        displaySymbol: asNetworkDisplaySymbol('tTRX'),
        name: 'Tron Nile',
        networkType: 'tron',
        bip43Path: "m/44'/195'/0'/0/i",
        decimals: TRON_DECIMALS,
        testnet: true,
        features: ['tokens', 'graph', 'nfts'],
        explorer: getExplorerUrls('https://nile.tronscan.org'),
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {},
        coingeckoId: undefined,
        tradeCryptoId: 'test-tron',
        yieldXyzId: null,
    },
};

export const getNetworkConfig = (symbol: TronNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
