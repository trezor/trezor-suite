import type { AccountInfo, MessageTypes, TokenInfo } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import {
    STELLAR_CONTRACT_TOKENS,
    STELLAR_DECIMALS,
    toStroops,
} from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import { RESERVE } from '../reserve';
import type { Request } from '../types';

const DEFAULT_TXS_PER_PAGE = 20;

// https://developers.stellar.org/docs/data/apis/horizon/api-reference/structure/pagination
const HORIZON_MAX_LIMIT = 200;

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
    isTestnet: boolean,
) => {
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
    const {
        computeSorobanAssetContractId,
        groupOperationsByTransaction,
        identifyTransaction,
        isNotFoundError,
        readSep41Tokens,
    } = await stellar();
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

    const watchedContracts = payload.stellarContractTokens ?? [];

    // A watched SAC would double-count the classic trustline Horizon already reported.
    const classicSacIds = new Set(
        (account.tokens ?? []).flatMap(token => {
            try {
                return [computeSorobanAssetContractId(token.contract).sorobanAssetContractId];
            } catch {
                return [];
            }
        }),
    );
    const contractsToRead = [
        ...new Set([...STELLAR_CONTRACT_TOKENS.map(token => token.contract), ...watchedContracts]),
    ].filter(contract => !classicSacIds.has(contract));

    const readContractTokens = async (): Promise<TokenInfo[]> => {
        if (isTestnet || contractsToRead.length === 0) return [];

        try {
            const sep41Tokens = await readSep41Tokens(
                // The backend serves stellar-rpc JSON-RPC on `POST /` from the same origin as
                // Horizon's REST paths, so contract storage comes from the account's own backend.
                api.serverURL.toString(),
                payload.descriptor,
                contractsToRead,
            );
            const fallbackByContract = new Map(
                STELLAR_CONTRACT_TOKENS.map(token => [token.contract, token]),
            );
            const watched = new Set(watchedContracts);

            return (
                sep41Tokens
                    // The curated list is only a discovery hint, so just the held ones surface; a
                    // contract the user added stays visible at zero, as an opted-in trustline does.
                    .filter(token => token.balance !== '0' || watched.has(token.contract))
                    .flatMap((token): TokenInfo[] => {
                        const fallback = fallbackByContract.get(token.contract);
                        const decimals = token.decimals ?? fallback?.decimals;

                        // Without decimals the balance cannot be scaled, and defaulting to the
                        // classic 7 would render an 18-decimal holding 10^11 times too large.
                        if (decimals == null) return [];

                        return [
                            {
                                standard: 'STELLAR-CONTRACT',
                                contract: token.contract,
                                balance: token.balance,
                                name: token.name ?? fallback?.name,
                                symbol: (token.symbol ?? fallback?.symbol ?? '').toUpperCase(),
                                decimals,
                            },
                        ];
                    })
            );
        } catch (error) {
            // Contract-token enrichment must never break classic account loading.
            console.warn('Stellar: failed to read Soroban SEP-41 tokens', error);

            return [];
        }
    };

    // Awaited only at assembly, so the RPC read overlaps the Horizon history fetch.
    const contractTokensPromise = readContractTokens();
    const mergeContractTokens = async () => {
        account.tokens = [...(account.tokens ?? []), ...(await contractTokensPromise)];
    };

    account.empty = false;

    if (payload.details !== 'txs') {
        await mergeContractTokens();

        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const pageSize = payload.pageSize || DEFAULT_TXS_PER_PAGE;

    // A SAC reports its transfers as `asset_balance_changes` on the host-function operation, which
    // only the operations resource exposes. `join('transactions')` embeds the transaction in the
    // same response — without it, `operation.transaction()` costs one HTTP request each.
    const fetchOperationGroups = async (limit: number, cursor: string | undefined) => {
        const requestBuilder = api
            .operations()
            .forAccount(payload.descriptor)
            .includeFailed(true)
            .join('transactions')
            .limit(limit)
            .order('desc');
        if (cursor) {
            requestBuilder.cursor(cursor);
        }

        const { records } = await requestBuilder.call();

        return {
            groups: groupOperationsByTransaction(records, records.length === limit),
            isWindowFull: records.length === limit,
        };
    };

    let groups: Awaited<ReturnType<typeof fetchOperationGroups>>['groups'] = [];
    try {
        // Consumers read a page shorter than `pageSize` as the end of the history, while an
        // operation window can hold arbitrarily few complete transactions.
        let cursor = payload.page && payload.page !== 1 ? payload.pageCursor : undefined;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        for (;;) {
            const window = await fetchOperationGroups(limit, cursor);
            groups = [...groups, ...window.groups];

            if (groups.length >= pageSize || !window.isWindowFull) break;

            // The protocol caps operations per transaction at 100, so the largest window always
            // completes a group; this only guards a Horizon response violating that cap.
            if (window.groups.length === 0 && limit === HORIZON_MAX_LIMIT) break;

            limit = HORIZON_MAX_LIMIT;
            cursor = window.groups[window.groups.length - 1]?.cursor ?? cursor;
        }
    } catch (error) {
        if (isNotFoundError(error)) {
            // Horizon retains limited history; accounts without activity in the retained
            // window return 404 on the operations endpoint even though they exist.
            account.history.transactions = [];
            await mergeContractTokens();

            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: { ...account, stellarCursor: undefined },
            } as const;
        }
        throw error;
    }

    const pageGroups = groups.slice(0, pageSize);

    // Horizon operation ids are TOIDs, whose high 32 bits are the ledger sequence:
    // https://github.com/stellar/go/blob/master/services/horizon/internal/docs/reference/toid.md
    const toLedgerSequence = (operationId: string) => {
        try {
            return Number(BigInt(operationId) >> 32n);
        } catch {
            return 0;
        }
    };

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

    await mergeContractTokens();

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            stellarCursor: pageGroups[pageGroups.length - 1]?.cursor,
        },
    } as const;
};
