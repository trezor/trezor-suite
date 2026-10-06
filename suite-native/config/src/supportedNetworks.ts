import { A } from '@mobily/ts-belt';

import {
    type AccountType,
    type Network,
    type NetworkSymbol,
    type NetworkType,
} from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

export const orderedAccountTypes: AccountType[] = [
    'normal',
    'taproot',
    'segwit',
    'legacy',
    'ledger',
    'root',
];

export const sendDisabledNetworkTypes: NetworkType[] = ['cardano'];

export const sortNetworks = (
    networksToSort: Network[],
    supportedNetworks: readonly NetworkSymbol[],
) =>
    A.sort(networksToSort, (a, b) => {
        const aOrder = supportedNetworks.indexOf(a.symbol);
        const bOrder = supportedNetworks.indexOf(b.symbol);

        return aOrder - bOrder;
    });

export const filterTestnetNetworks = (
    networkSymbols: NetworkSymbol[],
    isTestnetEnabled: boolean,
) => {
    if (isTestnetEnabled) return networkSymbols;

    return networkSymbols.filter(networkSymbol => !isTestnet(networkSymbol));
};
