import type { Transaction } from '@trezor/blockchain-link-types';
import {
    type ChainAccountNonce,
    type ChainNetwork,
    ChainSendError,
    type GetAccountNonceParams,
    type GetChainPendingSendsDep,
} from '@trezor/network-module-suite-common-types';

import { combineEvmAccountNonce } from './combineEvmAccountNonce';
import type { EvmNonceAccount, ReadEvmNonce } from './readEvmNonce';
import type { EvmSendAppDeps } from '../send/types';

export type EvmAccountNonceDeps = GetChainPendingSendsDep & {
    readNonce: ReadEvmNonce;
};

/** The nonce of one EVM network's accounts, and what its send needs of it. */
export type EvmAccountNonce = Pick<
    EvmSendAppDeps,
    'resolveEvmNonce' | 'getEvmPrivatePendingHint'
> & {
    getAccountNonce: (params: GetAccountNonceParams) => Promise<ChainAccountNonce>;
};

type OwnPendingSend = { txid: string; nonce: number };

const toOwnPendingSends = (transactions: readonly Transaction[]): OwnPendingSend[] =>
    transactions.flatMap(({ txid, ethereumSpecific }) =>
        typeof ethereumSpecific?.nonce === 'number'
            ? [{ txid, nonce: ethereumSpecific.nonce }]
            : [],
    );

/**
 * The account nonce an EVM network resolves itself: its backend's count, joined with the sends
 * the wallet broadcast that the backend may not list yet. Nothing is read from the wallet's store.
 */
export const createEvmAccountNonce = (
    deps: EvmAccountNonceDeps,
    network: Pick<ChainNetwork, 'symbol' | 'backendType'>,
): EvmAccountNonce => {
    const getOwnPendingSends = (descriptor: string) =>
        toOwnPendingSends(
            deps.getChainPendingSends({
                symbol: network.symbol,
                backendType: network.backendType,
                descriptor,
            }),
        );

    const readAccountNonce = async (account: EvmNonceAccount) => {
        const reading = await deps.readNonce(account);
        const ownPendingNonces = getOwnPendingSends(account.descriptor).map(({ nonce }) => nonce);

        return combineEvmAccountNonce(reading, ownPendingNonces);
    };

    return {
        getAccountNonce: ({ ref }) => readAccountNonce(ref),
        resolveEvmNonce: async ({ account, rbfParams }) => {
            // A replacement keeps the nonce of the transaction it replaces.
            if (rbfParams?.type === 'ethereum' && typeof rbfParams.ethereumNonce === 'number') {
                const rbfNonce = rbfParams.ethereumNonce.toString();

                return { nonce: rbfNonce, confirmedNonce: rbfNonce };
            }

            try {
                const { nextNonce, confirmedNonce } = await readAccountNonce({
                    symbol: account.symbol,
                    descriptor: account.descriptor,
                    connectionIdentity: account.deviceState,
                });

                return { nonce: nextNonce.toString(), confirmedNonce: confirmedNonce.toString() };
            } catch {
                throw new ChainSendError(
                    'sign-failed',
                    account.symbol,
                    'The account nonce could not be read from the backend.',
                );
            }
        },
        getEvmPrivatePendingHint: account => {
            const pendingSends = getOwnPendingSends(account.descriptor);
            if (pendingSends.length === 0) return undefined;

            return {
                nonces: [...new Set(pendingSends.map(({ nonce }) => nonce))].sort((a, b) => a - b),
                txids: [...new Set(pendingSends.map(({ txid }) => txid))].sort(),
            };
        },
    };
};
