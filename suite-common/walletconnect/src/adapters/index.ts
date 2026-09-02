import type { ProposalTypes } from '@walletconnect/types';

import { type Account } from '@suite-common/wallet-types';

import {
    type BitcoinRequestThunkDeps,
    type BitcoinRequestThunkState,
    bitcoinAdapter,
} from './bitcoin';
import {
    type EthereumRequestThunkDeps,
    type EthereumRequestThunkState,
    ethereumAdapter,
} from './ethereum';
import { type SolanaRequestThunkDeps, type SolanaRequestThunkState, solanaAdapter } from './solana';
import {
    type StellarRequestThunkDeps,
    type StellarRequestThunkState,
    stellarAdapter,
} from './stellar';
import { type TronRequestThunkDeps, type TronRequestThunkState, tronAdapter } from './tron';
import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
} from '../walletConnectTypes';

export type WalletConnectRequestThunkState = BitcoinRequestThunkState &
    EthereumRequestThunkState &
    SolanaRequestThunkState &
    StellarRequestThunkState &
    TronRequestThunkState;
export type WalletConnectRequestThunkDeps = BitcoinRequestThunkDeps &
    EthereumRequestThunkDeps &
    SolanaRequestThunkDeps &
    StellarRequestThunkDeps &
    TronRequestThunkDeps;

export const adapters: WalletConnectAdapter[] = [
    ethereumAdapter,
    solanaAdapter,
    bitcoinAdapter,
    stellarAdapter,
    tronAdapter,
];

export const getAdapterByMethod = (method: string) =>
    adapters.find(adapter => adapter.methods.includes(method));

export const getAdapterByNetwork = (networkType: string) =>
    adapters.find(adapter => adapter.networkType === networkType);

export const getNamespaces = (accounts: Account[]) => {
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
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    adapters.forEach(adapter =>
        adapter.processNamespaces(accounts, networks, namespaces, required),
    );
