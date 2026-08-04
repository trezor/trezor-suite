import type { AccountInfo, MessageTypes } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_DECIMALS, toStroops } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import { RESERVE } from '../reserve';
import type { Request } from '../types';

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
    const { identifyTransaction, isNotFoundError } = await stellar();
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
        .flatMap(balanceInfo => {
            // The Horizon backend is untrusted (user-selectable per network, incl. custom URLs).
            // A malformed credit_alphanum balance record omitting asset_code/asset_issuer would
            // otherwise crash the whole getAccountInfo via `.toUpperCase()` on the undefined
            // asset_code (poison-record DoS): one bad token nukes all balances + history for the
            // account. Drop the unidentifiable record — its contract key can't be formed anyway.
            if (
                typeof balanceInfo.asset_code !== 'string' ||
                typeof balanceInfo.asset_issuer !== 'string'
            ) {
                return [];
            }

            const contract = `${balanceInfo.asset_code}-${balanceInfo.asset_issuer}`;
            const balance = toStroops(balanceInfo.balance);

            return [
                {
                    standard: 'STELLAR-CLASSIC',
                    contract,
                    balance: balance.toString(),
                    name: tokenMetadata[contract]?.name || balanceInfo.asset_code,
                    symbol: (
                        tokenMetadata[contract]?.symbol || balanceInfo.asset_code
                    ).toUpperCase(),
                    decimals: STELLAR_DECIMALS,
                },
            ];
        });
    account.empty = false;

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const requestBuilder = await api
        .transactions()
        .forAccount(payload.descriptor)
        .includeFailed(true)
        .limit(payload.pageSize || 20)
        .order('desc');
    if (payload.page && payload.page !== 1 && payload.pageCursor) {
        requestBuilder.cursor(payload.pageCursor);
    }
    let transactions;
    try {
        transactions = await requestBuilder.call();
    } catch (error) {
        if (isNotFoundError(error)) {
            // Horizon retains limited history; accounts without activity in the retained
            // window return 404 on the transactions endpoint even though they exist
            account.history.transactions = [];

            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: { ...account, stellarCursor: undefined },
            } as const;
        }
        throw error;
    }

    // The Horizon backend is untrusted (user-selectable per network, incl. custom URLs). A
    // malformed transactions response whose `records` is not an array would otherwise crash the
    // whole getAccountInfo via `.map` (poison-response DoS: no balances/history load for the
    // account). Coerce to an empty list at this data boundary so the account still loads.
    const records = Array.isArray(transactions.records) ? transactions.records : [];

    account.history.transactions = records
        .map(identifyTransaction)
        .map(identified =>
            utils.transformTransaction(identified, payload.descriptor, tokenMetadata),
        );

    const cursor = records[records.length - 1]?.paging_token;

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            stellarCursor: cursor,
        },
    } as const;
};
