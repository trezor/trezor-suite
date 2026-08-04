import { A } from '@mobily/ts-belt';

import {
    type AccountType,
    type Network,
    type NetworkConfigDeps,
    type NetworkSymbol,
    type NetworkType,
    getNetworks,
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

export const sortNetworks = (deps: NetworkConfigDeps, networksToSort: Network[]) => {
    const networkSymbols = getNetworks(deps).map(network => network.symbol);

    return A.sort(networksToSort, (a, b) => {
        const aOrder = networkSymbols.indexOf(a.symbol);
        const bOrder = networkSymbols.indexOf(b.symbol);

        return aOrder - bOrder;
    });
};

export const filterTestnetNetworks = (
    deps: NetworkConfigDeps,
    networkSymbols: NetworkSymbol[],
    isTestnetEnabled: boolean,
) => {
    if (isTestnetEnabled) return networkSymbols;

    return networkSymbols.filter(networkSymbol => !isTestnet(deps, networkSymbol));
};
