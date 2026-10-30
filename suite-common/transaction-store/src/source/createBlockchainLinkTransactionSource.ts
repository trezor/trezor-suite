import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountInfo, AccountInfoParams } from '@trezor/blockchain-link-types';
import { err, ok } from '@trezor/type-utils';

import type { TransactionSource } from './transactionSource';

/** The part of a `BlockchainLink` instance the store uses. */
export type BlockchainLinkClient = {
    getAccountInfo: (params: AccountInfoParams) => Promise<AccountInfo>;
};

export type BlockchainLinkTransactionSourceDeps = {
    /**
     * What answers for the network, on the user's backend (on web and desktop, the app's Connect);
     * `undefined` for a network nothing answers for.
     */
    getBlockchainLink: (symbol: NetworkSymbol) => BlockchainLinkClient | undefined;
    pageSize: number;
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
                // from 0, Electrum always says page 1 and sends everything), so only a page of exactly
                // the size asked for can have more after it.
                hasNextPage:
                    accountInfo.page !== undefined &&
                    transactions.length === deps.pageSize &&
                    accountInfo.page.index < accountInfo.page.total,
            });
        } catch {
            // The message is dropped on purpose: backends echo the descriptor in it.
            return err('BackendError');
        }
    },
});
