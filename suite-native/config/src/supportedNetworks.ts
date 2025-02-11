import { A } from '@mobily/ts-belt';

import {
    type AccountType,
    type Network,
    type NetworkSymbol,
    NetworkType,
    getMainnets,
    getTestnets,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

export const orderedAccountTypes: AccountType[] = [
    'normal',
    'taproot',
    'segwit',
    'legacy',
    'ledger',
];

// All supported coins for device discovery
export const networkSymbolsWhitelistMap: Record<'mainnet' | 'testnet', readonly NetworkSymbol[]> = {
    mainnet: [
        'btc',
        'eth',
        'pol',
        'sol',
        'bsc',
        'ltc',
        'etc',
        'ada',
        'xrp',
        'bch',
        'doge',
        'zec',
        'op',
        'base',
        'arb',
    ],
    testnet: ['test', 'regtest', 'tsep', 'thol', 'dsol', 'tada', 'txrp'],
};

export const sendDisabledNetworkTypes: NetworkType[] = ['cardano'];

export const sortNetworks = (networksToSort: Network[]) =>
    A.sort(networksToSort, (a, b) => {
        const aOrder = networkSymbolCollection.indexOf(a.symbol);
        const bOrder = networkSymbolCollection.indexOf(b.symbol);

        return aOrder - bOrder;
    });

export const filterTestnetNetworks = (
    networkSymbols: NetworkSymbol[],
    isTestnetEnabled: boolean,
) => {
    if (isTestnetEnabled) return networkSymbols;

    return networkSymbols.filter(networkSymbol => !isTestnet(networkSymbol));
};

export const getNativeMainnetSymbols = () =>
    sortNetworks(
        getMainnets().filter(({ symbol }) => networkSymbolsWhitelistMap.mainnet.includes(symbol)),
    ).map(n => n.symbol);

export const getNativeTestnetSymbols = () =>
    sortNetworks(
        getTestnets().filter(({ symbol }) => networkSymbolsWhitelistMap.testnet.includes(symbol)),
    ).map(n => n.symbol);
