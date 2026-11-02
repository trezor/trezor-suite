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

/**
 * What the next request carries on from the last response. Each backend reads its own part: the
 * page number (blockbook, Solana), the ledger marker (Ripple) or the cursor (Stellar); the rest it
 * ignores.
 */
type BlockchainLinkPageCursor = Pick<AccountInfoParams, 'marker' | 'pageCursor'> & {
    page: number;
};

const FIRST_PAGE: BlockchainLinkPageCursor = { page: 1 };

type GetNextPageCursorParams = {
    accountInfo: AccountInfo;
    cursor: BlockchainLinkPageCursor;
    pageSize: number;
};

const getNextPageCursor = ({
    accountInfo,
    cursor,
    pageSize,
}: GetNextPageCursorParams): BlockchainLinkPageCursor | undefined => {
    const transactionCount = accountInfo.history.transactions?.length ?? 0;
    // Every backend fills a page before it starts the next, so a short one is the last. A full one
    // is the last when a backend counting pages says so (blockbook counts from 1, Solana counts
    // transactions and pages from 0, Electrum always says page 1 and sends everything), or when a
    // backend walking a marker hands none over. One walking a cursor always hands one over; its
    // history ends with an empty page.
    const hasPageAfter =
        accountInfo.page !== undefined
            ? accountInfo.page.index < accountInfo.page.total
            : accountInfo.marker !== undefined || accountInfo.stellarCursor !== undefined;

    if (transactionCount < pageSize || !hasPageAfter) {
        return undefined;
    }

    return {
        page: cursor.page + 1,
        // Only what the backend gave: a marker it did not ask for fails its validation.
        ...(accountInfo.marker !== undefined ? { marker: accountInfo.marker } : {}),
        ...(accountInfo.stellarCursor !== undefined
            ? { pageCursor: accountInfo.stellarCursor }
            : {}),
    };
};

export const createBlockchainLinkTransactionSource = (
    deps: BlockchainLinkTransactionSourceDeps,
): TransactionSource => ({
    fetchTransactionsPage: async ({ account, after }) => {
        const blockchainLink = deps.getBlockchainLink(account.symbol);

        if (blockchainLink === undefined) {
            return err('BackendUnavailable');
        }

        // Only this source makes these, in `getNextPageCursor`.
        const cursor = (after as BlockchainLinkPageCursor | undefined) ?? FIRST_PAGE;

        try {
            const accountInfo = await blockchainLink.getAccountInfo({
                descriptor: account.descriptor,
                details: 'txs',
                pageSize: deps.pageSize,
                ...cursor,
            });

            return ok({
                transactions: accountInfo.history.transactions ?? [],
                nextPage: getNextPageCursor({ accountInfo, cursor, pageSize: deps.pageSize }),
            });
        } catch {
            // The message is dropped on purpose: backends echo the descriptor in it.
            return err('BackendError');
        }
    },
});
