import { getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { ethereumAdapter } from './ethereum';
import { WalletConnectAdapter, WalletConnectNamespace } from '../walletConnectTypes';

export const adapters: WalletConnectAdapter[] = [
    ethereumAdapter,
    // TODO: solanaAdapter
    // TODO: bitcoinAdapter
];

export const getAdapterByMethod = (method: string) =>
    adapters.find(adapter => adapter.methods.includes(method));

export const getAdapterByNetwork = (networkType: string) =>
    adapters.find(adapter => adapter.networkType === networkType);

export const getAllMethods = () => adapters.flatMap(adapter => adapter.methods);

export const getNamespaces = (accounts: Account[]) => {
    const eip155 = {
        chains: [],
        accounts: [],
        methods: getAllMethods(),
        events: ['accountsChanged', 'chainChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { chainId, networkType } = network;

        if (!account.visible || !getAdapterByNetwork(networkType)) return;

        const walletConnectChainId = `eip155:${chainId}`;
        if (!eip155.chains.includes(walletConnectChainId)) {
            eip155.chains.push(walletConnectChainId);
        }
        eip155.accounts.push(`${walletConnectChainId}:${account.descriptor}`);
    });

    return { eip155 };
};
