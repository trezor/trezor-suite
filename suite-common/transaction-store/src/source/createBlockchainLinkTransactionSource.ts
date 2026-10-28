import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountInfo, AccountInfoParams, BlockEvent } from '@trezor/blockchain-link-types';
import { err, ok } from '@trezor/type-utils';

import type { TransactionSource } from './transactionSource';

type BlockListener = (block: BlockEvent['payload']) => void;

/** The part of a `BlockchainLink` instance the store uses. */
export type BlockchainLinkClient = {
    getAccountInfo: (params: AccountInfoParams) => Promise<AccountInfo>;
    subscribe: (params: { type: 'block' }) => Promise<unknown>;
    unsubscribe: (params: { type: 'block' }) => Promise<unknown>;
    on: (event: 'block', listener: BlockListener) => unknown;
    off: (event: 'block', listener: BlockListener) => unknown;
};

export type BlockchainLinkTransactionSourceDeps = {
    /**
     * The engine's own instance for the network, connected to the user's backend; `undefined` for
     * a network it has none for. Owned by the entry, not shared with the app, since unsubscribing
     * from blocks here would end the app's subscription too.
     */
    getBlockchainLink: (symbol: NetworkSymbol) => BlockchainLinkClient | undefined;
    pageSize: number;
    /** False for networks whose blocks come too often to sync on each (Solana); they use the interval. */
    shouldSubscribeBlocks: (symbol: NetworkSymbol) => boolean;
};

export const createBlockchainLinkTransactionSource = (
    deps: BlockchainLinkTransactionSourceDeps,
): TransactionSource => ({
    fetchTransactionsPage: async ({ account, page }) => {
        const blockchainLink = deps.getBlockchainLink(account.symbol);

        if (blockchainLink === undefined) {
            return err('BackendUnavailable');
        }

        try {
            const accountInfo = await blockchainLink.getAccountInfo({
                descriptor: account.descriptor,
                details: 'txs',
                page,
                pageSize: deps.pageSize,
            });

            const transactions = accountInfo.history.transactions ?? [];

            return ok({
                transactions,
                // Only paging backends answer with a page; the others send the whole history. Their
                // `page` differs (blockbook counts pages from 1, Solana counts transactions and pages
                // from 0), so a page shorter than asked for is what ends the history for all of them.
                hasNextPage:
                    accountInfo.page !== undefined &&
                    transactions.length >= deps.pageSize &&
                    accountInfo.page.index < accountInfo.page.total,
            });
        } catch {
            // The message is dropped on purpose: backends echo the descriptor in it.
            return err('BackendError');
        }
    },

    subscribeBlocks: async ({ symbol, onBlock }) => {
        const blockchainLink = deps.getBlockchainLink(symbol);

        if (blockchainLink === undefined) {
            return err('BackendUnavailable');
        }
        if (!deps.shouldSubscribeBlocks(symbol)) {
            // Nothing to end: the watcher's interval alone keeps this network fresh.
            return ok(() => {});
        }

        try {
            await blockchainLink.subscribe({ type: 'block' });
        } catch {
            return err('BackendError');
        }

        const listener: BlockListener = () => onBlock();
        blockchainLink.on('block', listener);

        return ok(() => {
            blockchainLink.off('block', listener);
            // Ending the subscription is best effort; a dead connection has ended it already.
            blockchainLink.unsubscribe({ type: 'block' }).catch(() => {});
        });
    },
});
