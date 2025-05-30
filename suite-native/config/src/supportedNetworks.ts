import { A } from '@mobily/ts-belt';

import {
    AccountType,
    Network,
    NetworkSymbol,
    NetworkType,
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
