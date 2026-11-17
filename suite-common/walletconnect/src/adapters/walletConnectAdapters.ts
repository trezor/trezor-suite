import type { ProposalTypes } from '@walletconnect/types';

import { type Account } from '@suite-common/wallet-types';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
} from '../walletConnectTypes';

export const getAdapterByMethod = (adapters: WalletConnectAdapter[], method: string) =>
    adapters.find(adapter => adapter.methods.includes(method));

export const getAdapterByNetwork = (adapters: WalletConnectAdapter[], networkType: string) =>
    adapters.find(adapter => adapter.networkType === networkType);

export const getNamespaces = (adapters: WalletConnectAdapter[], accounts: Account[]) => {
    const accountsDeduped: Account[] = [];
    accounts.forEach(account => {
        if (
            !accountsDeduped.some(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            )
        ) {
            accountsDeduped.push(account);
        }
    });

    return adapters
        .map(adapter => adapter.getNamespace(accountsDeduped))
        .reduce((acc, val) => {
            Object.assign(acc, val);

            return acc;
        }, {});
};

export const processNamespaces = (
    adapters: WalletConnectAdapter[],
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    adapters.forEach(adapter =>
        adapter.processNamespaces(accounts, networks, namespaces, required),
    );
