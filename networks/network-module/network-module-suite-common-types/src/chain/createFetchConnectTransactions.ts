import type { AccountInfo, GetTrezorConnectDep } from '@trezor/connect-common';

import { ChainNetworkError } from './ChainNetworkError';
import type {
    ChainTransactionsCursor,
    ChainTransactionsPage,
    GetTransactionsParams,
} from './ChainTransactions';
import { toCoinSymbol } from './toCoinSymbol';

export type FetchConnectTransactionsDeps = GetTrezorConnectDep<'getAccountInfo'>;

/**
 * How a backend pages history:
 * - `page`: numbered pages, `page.index` of `page.total` pages (Blockbook, Blockfrost);
 * - `solana-page`: numbered pages, 0-based `index`, `total` counting transactions;
 * - `ripple-marker`: the next page starts at the returned marker, never sent for the first;
 * - `stellar-cursor`: the returned cursor, which the backend reads only after the first page.
 */
export type TransactionsPagination = 'page' | 'solana-page' | 'ripple-marker' | 'stellar-cursor';

export type FetchConnectTransactionsParams = GetTransactionsParams & {
    pagination: TransactionsPagination;
    pageSize: number;
    useConnectionIdentity: boolean;
    /** Passes the account's watched Soroban contracts, whose transfers belong to its history. */
    useStellarContractTokens: boolean;
    gap?: number;
    protocols?: readonly 'erc4626'[];
};

export type FetchConnectTransactions = (
    params: FetchConnectTransactionsParams,
) => Promise<ChainTransactionsPage>;

const getNextCursor = (
    params: FetchConnectTransactionsParams,
    payload: AccountInfo,
    receivedCount: number,
): ChainTransactionsCursor | null => {
    const nextPage = params.cursor.page + 1;
    const { page } = payload;

    switch (params.pagination) {
        case 'page':
            return page && page.index < page.total ? { page: nextPage } : null;
        case 'solana-page':
            return page && (page.index + 1) * page.size < page.total ? { page: nextPage } : null;
        case 'ripple-marker':
            return payload.marker ? { page: nextPage, marker: payload.marker } : null;
        case 'stellar-cursor':
            return payload.stellarCursor && receivedCount >= params.pageSize
                ? { page: nextPage, pageCursor: payload.stellarCursor }
                : null;
    }
};

const isTotalKnown = (pagination: TransactionsPagination) =>
    pagination !== 'ripple-marker' && pagination !== 'stellar-cursor';

/**
 * Reads one page of an account's history through Connect, with the network's paging rules.
 * Transactions come back as the backend lists them; wallet-specific enrichment is the app's.
 */
export const createFetchConnectTransactions =
    (deps: FetchConnectTransactionsDeps): FetchConnectTransactions =>
    async params => {
        const { ref, cursor } = params;
        const isFirstPage = cursor.page === 1;

        const result = await deps.getTrezorConnect().getAccountInfo({
            coin: toCoinSymbol(ref.symbol),
            descriptor: ref.descriptor,
            details: 'txs',
            suppressBackupWarning: true,
            page: cursor.page,
            pageSize: params.pageSize,
            marker: !isFirstPage ? cursor.marker : undefined,
            pageCursor: !isFirstPage ? cursor.pageCursor : undefined,
            identity: params.useConnectionIdentity ? ref.connectionIdentity : undefined,
            gap: params.gap,
            protocols: params.protocols ? [...params.protocols] : undefined,
            stellarContractTokens: params.useStellarContractTokens
                ? ref.watchedTokens?.filter(id => !id.includes('-'))
                : undefined,
        });

        // The backend message can echo the descriptor, so it is dropped here.
        if (!result.success) {
            throw new ChainNetworkError('account-info-failed', ref.symbol);
        }

        const transactions = result.payload.history.transactions ?? [];
        const { total } = result.payload.history;

        return {
            transactions,
            nextCursor: getNextCursor(params, result.payload, transactions.length),
            total: isTotalKnown(params.pagination) && total >= 0 ? total : null,
            addresses: result.payload.addresses,
        };
    };
