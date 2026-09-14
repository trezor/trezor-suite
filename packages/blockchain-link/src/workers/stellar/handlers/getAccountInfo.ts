import type { AccountInfo, MessageTypes } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_DECIMALS, toStroops } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import { RESERVE } from '../reserve';
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
            reserve: RESERVE.BASE.times(2).toString(),
            baseReserve: RESERVE.BASE.toString(),
        },
    };

    const api = await request.connect();
    const { identifyTransaction, isNotFoundError, readAccountHistory } = await stellar();
    let info;
    try {
        info = await api.accounts().accountId(payload.descriptor).call();
    } catch (error) {
        // Other errors (rate limiting, outage) must not be reported as an empty account
        if (!isNotFoundError(error)) {
            throw error;
        }

        // Account not found, we set the account as empty
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // Account is not empty, we can fill the account object with the data
    // https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance
    const reserve = RESERVE.BASE.times(2 + info.subentry_count);
    account.misc = {
        stellarSequence: info.sequence,
        reserve: reserve.toString(),
        baseReserve: RESERVE.BASE.toString(),
    };

    // XLM balance
    const nativeTokenBalance = info.balances.find(balance => balance.asset_type === 'native');
    if (!nativeTokenBalance) {
        // This should never happen, but just in case
        throw new CustomError('stellar_missing_native_balance');
    }
    const sellingLiabilities = toStroops(nativeTokenBalance.selling_liabilities);
    account.balance = toStroops(nativeTokenBalance.balance).toString();
    account.availableBalance = new BigNumber(account.balance)
        .minus(reserve)
        .minus(sellingLiabilities)
        .minus(RESERVE.BASE.times(info.num_sponsoring)) // See https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/sponsored-reserves
        .plus(RESERVE.BASE.times(info.num_sponsored))
        .toString();

    // Tokens balance
    const tokenMetadata = await request.getTokenMetadata();
    account.tokens = info.balances
        .filter(
            balanceInfo =>
                balanceInfo.asset_type === 'credit_alphanum4' ||
                balanceInfo.asset_type === 'credit_alphanum12',
        )
        .map(balanceInfo => {
            const contract = `${balanceInfo.asset_code}-${balanceInfo.asset_issuer}`;
            const balance = toStroops(balanceInfo.balance);

            return {
                standard: 'STELLAR-CLASSIC',
                contract,
                balance: balance.toString(),
                name: tokenMetadata[contract]?.name || balanceInfo.asset_code,
                symbol: (tokenMetadata[contract]?.symbol || balanceInfo.asset_code).toUpperCase(),
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

    const pageGroups = await readAccountHistory({
        horizon: api,
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
        pageGroups.map(async ({ operations }) => {
            try {
                // Resolved from the joined response, so this does not hit the network.
                const rawTx = await operations[0].transaction();

                return utils.transformTransaction(
                    identifyTransaction(operations, rawTx),
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
