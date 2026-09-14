import type { AccountInfo, MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_BASE_RESERVE, STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import type { Request } from '../types';

const DEFAULT_TXS_PER_PAGE = 20;

// Horizon operation ids are TOIDs, whose high 32 bits are the ledger sequence:
// https://github.com/stellar/go/blob/master/services/horizon/internal/docs/reference/toid.md
const toLedgerSequence = (operationId: string) => {
    try {
        return Number(BigInt(operationId) >> 32n);
    } catch {
        return 0;
    }
};

export const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    // The reserve has changed once in the network's history, so a failed ledger-head read must not
    // make the account unloadable; the worker's own read stays strict.
    const baseReserve = new BigNumber(
        await request.getBaseReserve().catch(() => STELLAR_BASE_RESERVE),
    );

    // initial state (basic)
    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0', // default balance
        availableBalance: '0', // default balance
        empty: true,
        history: {
            // default history
            total: -1,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {
            // default misc
            stellarSequence: '0',
            reserve: baseReserve.times(2).toString(),
            baseReserve: baseReserve.toString(),
        },
    };

    const api = await request.connect();
    const { createStellarDataSource, identifyTransaction, parseClassicAssetContract } =
        await stellar();
    const dataSource = createStellarDataSource(api);

    const tokenMetadata = await request.getTokenMetadata();
    // Only consulted when trustlines are discovered over RPC, which cannot enumerate them.
    const knownAssets = [
        ...new Set([...Object.keys(tokenMetadata), ...(payload.stellarClassicTokens ?? [])]),
    ].flatMap(contract => parseClassicAssetContract(contract) ?? []);

    const state = await dataSource.readAccountState({
        descriptor: payload.descriptor,
        knownAssets,
    });

    if (!state.exists) {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance
    const reserve = baseReserve.times(2 + state.numSubEntries);
    account.misc = {
        stellarSequence: state.sequence,
        reserve: reserve.toString(),
        baseReserve: baseReserve.toString(),
    };

    account.balance = state.balance;
    account.availableBalance = new BigNumber(account.balance)
        .minus(reserve)
        .minus(state.sellingLiabilities)
        .minus(baseReserve.times(state.numSponsoring)) // See https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/sponsored-reserves
        .plus(baseReserve.times(state.numSponsored))
        .toString();

    account.tokens = state.trustlines.map(({ assetCode, assetIssuer, balance }) => {
        const contract = `${assetCode}-${assetIssuer}`;

        return {
            standard: 'STELLAR-CLASSIC',
            contract,
            balance,
            name: tokenMetadata[contract]?.name || assetCode,
            symbol: (tokenMetadata[contract]?.symbol || assetCode).toUpperCase(),
            decimals: STELLAR_DECIMALS,
        };
    });
    account.empty = false;

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const pageGroups = await dataSource.readAccountHistory({
        descriptor: payload.descriptor,
        pageSize: payload.pageSize || DEFAULT_TXS_PER_PAGE,
        cursor: payload.page && payload.page !== 1 ? payload.pageCursor : undefined,
    });

    // Everything `transformTransaction` needs for an `unknown` transaction, read off the operation
    // alone — the fallback of a parse that already failed, so it must not throw in turn.
    const describeUnparseableOperation = (
        operation: (typeof pageGroups)[number]['operations'][number],
    ) => {
        const createdAt = Date.parse(operation.created_at);

        return {
            type: 'unknown' as const,
            hash: operation.transaction_hash,
            // The fee is charged per transaction and only the transaction record reports it.
            fee: '0',
            feeSource: '',
            ledgerAttr: toLedgerSequence(operation.id),
            createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt / 1000) : 0,
            memo: undefined,
        };
    };

    account.history.transactions = await Promise.all(
        pageGroups.map(async ({ operations, effects }) => {
            try {
                // Resolved from the joined response, so this does not hit the network.
                const rawTx = await operations[0].transaction();

                return utils.transformTransaction(
                    identifyTransaction(operations, rawTx, effects),
                    payload.descriptor,
                    tokenMetadata,
                );
            } catch (error) {
                // A short page reads as the end of the history and its empty slot never counts as
                // fetched, so the record keeps its slot as an `unknown` transaction.
                console.warn('Stellar: failed to parse a transaction record', error);

                return utils.transformTransaction(
                    describeUnparseableOperation(operations[0]),
                    payload.descriptor,
                    tokenMetadata,
                );
            }
        }),
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            stellarCursor: pageGroups[pageGroups.length - 1]?.cursor,
        },
    } as const;
};
