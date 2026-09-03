import type { AccountInfo, MessageTypes, TokenInfo } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import {
    STELLAR_CONTRACT_TOKENS,
    STELLAR_DECIMALS,
    STELLAR_SOROBAN_RPC_URL,
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

    // Soroban contract (type-C / SEP-41) tokens.
    // Horizon cannot see these, so they are read from a Stellar RPC node.
    // Tokens are self-describing: balance + metadata (decimals/symbol/name) are
    // read from each contract's SEP-41 interface. There is no on-chain registry of
    // contract-token holdings, so the contracts to read are a curated list plus
    // whatever the user added themselves.
    // Enabled on mainnet only (the PoC RPC endpoint is mainnet).
    const watchedContracts = payload.stellarContractTokens ?? [];

    // A Stellar Asset Contract mirrors the classic trustline balance Horizon already reported,
    // so a watched SAC of an asset the account holds would double-count the holding.
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
                STELLAR_SOROBAN_RPC_URL,
                payload.descriptor,
                contractsToRead,
            );
            const fallbackByContract = new Map(
                STELLAR_CONTRACT_TOKENS.map(token => [token.contract, token]),
            );
            const watched = new Set(watchedContracts);

            return (
                sep41Tokens
                    // The curated list is only a discovery hint, so surface just the ones the
                    // account actually holds. A contract the user added stays visible at a zero
                    // balance, the way an opted-in trustline does.
                    .filter(token => token.balance !== '0' || watched.has(token.contract))
                    .map(token => {
                        // Prefer on-chain SEP-41 metadata; fall back to the curated entry.
                        const fallback = fallbackByContract.get(token.contract);

                        return {
                            standard: 'STELLAR-CONTRACT',
                            contract: token.contract,
                            balance: token.balance,
                            name: token.name ?? fallback?.name,
                            symbol: (token.symbol ?? fallback?.symbol ?? '').toUpperCase(),
                            decimals: token.decimals ?? fallback?.decimals ?? STELLAR_DECIMALS,
                        };
                    })
            );
        } catch (error) {
            // Contract-token enrichment must never break classic account loading.
            console.warn('Stellar: failed to read Soroban SEP-41 tokens', error);

            return [];
        }
    };

    // Kicked off here and awaited only when the response is assembled, so the RPC read runs
    // concurrently with the Horizon history fetch instead of stalling it.
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

    // A Stellar Asset Contract reports its transfers as `asset_balance_changes` on the
    // host-function operation, which only the operations resource exposes. `join('transactions')`
    // embeds the transaction in the same response — without it, reading `operation.transaction()`
    // would fire one HTTP request per operation.
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
        // The page consumers assume exactly `pageSize` transactions per page — a shorter page
        // reads as the end of the history — while an operation window can hold arbitrarily few
        // complete transactions, so windows are accumulated until the page fills up or the
        // history ends.
        let cursor = payload.page && payload.page !== 1 ? payload.pageCursor : undefined;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        for (;;) {
            const window = await fetchOperationGroups(limit, cursor);
            groups = [...groups, ...window.groups];

            if (groups.length >= pageSize || !window.isWindowFull) break;

            // A single transaction can fill a whole window, dropping its trailing group with
            // nothing complete before it. The protocol caps operations per transaction at 100,
            // so the largest window Horizon allows always completes at least one group — the
            // guard only protects against a Horizon response violating that cap.
            if (window.groups.length === 0 && limit === HORIZON_MAX_LIMIT) break;

            limit = HORIZON_MAX_LIMIT;
            cursor = window.groups[window.groups.length - 1]?.cursor ?? cursor;
        }
    } catch (error) {
        if (isNotFoundError(error)) {
            // Horizon retains limited history; accounts without activity in the retained
            // window return 404 on the operations endpoint even though they exist
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

    const pageTransactions = await Promise.all(
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
                // A single unparseable record must not fail the whole account history.
                console.warn('Stellar: failed to parse a transaction record', error);

                return undefined;
            }
        }),
    );
    account.history.transactions = pageTransactions.filter(
        (transaction): transaction is NonNullable<typeof transaction> => transaction != null,
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
