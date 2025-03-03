import type { ProposalTypes } from '@walletconnect/types';

import { Account } from '@suite-common/wallet-types';

import { ethereumAdapter } from './ethereum';
import { solanaAdapter } from './solana';
import { PendingConnectionProposalNetwork, WalletConnectAdapter } from '../walletConnectTypes';

export const adapters: WalletConnectAdapter[] = [
    ethereumAdapter,
    solanaAdapter,
    // TODO: bitcoinAdapter
];

export const getAdapterByMethod = (method: string) =>
    adapters.find(adapter => adapter.methods.includes(method));

export const getAdapterByNetwork = (networkType: string) =>
    adapters.find(adapter => adapter.networkType === networkType);

export const getAllMethods = () => adapters.flatMap(adapter => adapter.methods);

export const getNamespaces = (accounts: Account[]) =>
    adapters
        .map(adapter => adapter.getNamespace(accounts))
        .reduce((acc, val) => {
            Object.assign(acc, val);

            return acc;
        }, {});

export const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    adapters.forEach(adapter =>
        adapter.processNamespaces(accounts, networks, namespaces, required),
    );
