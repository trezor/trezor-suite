import type { AccountInfo, MessageTypes, TokenInfo } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import {
    STELLAR_BASE_RESERVE,
    STELLAR_CONTRACT_TOKENS,
    STELLAR_DECIMALS,
} from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import {
    formatStellarPageCursor,
    mergeContractTokenReceipts,
    parseStellarPageCursor,
} from '../receipts';
import type { Request } from '../types';

const DEFAULT_TXS_PER_PAGE = 20;

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
    isTestnet: boolean,
) => {
    const { payload } = request;
    // A failed ledger-head read must not make the account unloadable.
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
    const {
        computeSorobanAssetContractId,
        createStellarDataSource,
        describeTransaction,
        isValidContractId,
        parseClassicAssetContract,
        readSep41Tokens,
    } = await stellar();
    const dataSource = createStellarDataSource(api);

    const tokenMetadata = await request.getTokenMetadata();
    // Only consulted when trustlines are discovered over RPC.
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

    const watchedContracts = payload.stellarContractTokens ?? [];

    // A watched SAC would double-count the classic trustline already reported above.
    const classicSacIds = new Set(
        (account.tokens ?? []).flatMap(token => {
            try {
                return [computeSorobanAssetContractId(token.contract).sorobanAssetContractId];
            } catch {
                return [];
            }
        }),
    );
    // The hosted definitions are the allow-list; the curated constants are the fallback.
    const definedContracts = Object.keys(tokenMetadata).filter(isValidContractId);
    const contractsToRead = [
        ...new Set([
            ...definedContracts,
            ...STELLAR_CONTRACT_TOKENS.map(token => token.contract),
            ...watchedContracts,
        ]),
    ].filter(contract => !classicSacIds.has(contract));

    const readContractTokens = async (): Promise<TokenInfo[]> => {
        if (isTestnet || contractsToRead.length === 0) return [];

        try {
            const sep41Tokens = await readSep41Tokens(
                api.rpc,
                payload.descriptor,
                contractsToRead,
                api.passphrase,
            );
            const fallbackByContract = new Map<
                string,
                { name?: string; symbol?: string; decimals?: number }
            >([
                ...STELLAR_CONTRACT_TOKENS.map(token => [token.contract, token] as const),
                ...definedContracts.map(
                    contract => [contract, tokenMetadata[contract] ?? {}] as const,
                ),
            ]);
            const watched = new Set(watchedContracts);

            return (
                sep41Tokens
                    // Curated tokens surface only when held; user-added ones stay visible at zero.
                    .filter(token => token.balance !== '0' || watched.has(token.contract))
                    .flatMap((token): TokenInfo[] => {
                        const fallback = fallbackByContract.get(token.contract);
                        const decimals = token.decimals ?? fallback?.decimals;

                        // Defaulting to 7 decimals would inflate an 18-decimal holding 10^11 times.
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
    const requested = parseStellarPageCursor(
        payload.page && payload.page !== 1 ? payload.pageCursor : undefined,
    );
    const pageGroups = await dataSource.readAccountHistory({
        descriptor: payload.descriptor,
        pageSize,
        cursor: requested.horizon,
    });

    // Horizon operation ids are TOIDs, whose high 32 bits are the ledger sequence.
    const toLedgerSequence = (operationId: string) => {
        try {
            return Number(BigInt(operationId) >> 32n);
        } catch {
            return 0;
        }
    };

    // Fallback for a record that failed to parse, so it must not throw itself.
    const describeUnparseableOperation = (
        operation: (typeof pageGroups)[number]['operations'][number],
    ) => {
        const createdAt = Date.parse(operation.created_at);

        return {
            type: 'unknown' as const,
            hash: operation.transaction_hash,
            // Only the transaction record reports the fee.
            fee: '0',
            feeSource: '',
            ledgerAttr: toLedgerSequence(operation.id),
            createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt / 1000) : 0,
            memo: undefined,
        };
    };

    const horizonTransactions = await Promise.all(
        pageGroups.map(async ({ operations, effects }) => {
            try {
                // Resolved from the joined response, so this does not hit the network.
                const rawTx = await operations[0].transaction();

                return utils.transformTransaction(
                    describeTransaction(operations, rawTx, effects),
                    payload.descriptor,
                    tokenMetadata,
                );
            } catch (error) {
                // A dropped record would shorten the page, which reads as the end of the history.
                console.warn('Stellar: failed to parse a transaction record', error);

                return utils.transformTransaction(
                    describeUnparseableOperation(operations[0]),
                    payload.descriptor,
                    tokenMetadata,
                );
            }
        }),
    );

    account.history.transactions = horizonTransactions;
    let cursor = {
        horizon: pageGroups[pageGroups.length - 1]?.cursor ?? requested.horizon,
        receipts: requested.receipts,
    };

    await mergeContractTokens();

    // Horizon lists a Soroban call for its source alone and reports no amount for a SEP-41
    // transfer; the token's own events answer both, as far back as the node keeps them.
    const applyContractTokenReceipts = async () => {
        const contractTokens = (account.tokens ?? []).filter(
            token => token.standard === 'STELLAR-CONTRACT',
        );
        if (isTestnet || contractTokens.length === 0) return;

        try {
            const { readContractTokenTransfers } = await stellar();
            const transfers = await readContractTokenTransfers({
                server: api.rpc,
                account: payload.descriptor,
                contractIds: contractTokens.map(token => token.contract),
            });

            const merged = mergeContractTokenReceipts({
                descriptor: payload.descriptor,
                horizonTransactions,
                transfers,
                tokenByContract: new Map(contractTokens.map(token => [token.contract, token])),
                pageSize,
                isLastHorizonPage: pageGroups.length < pageSize,
                position: requested.receipts,
            });

            account.history.transactions = merged.transactions;
            cursor = {
                // The Horizon rows a transfer pushed out of the page wait here for the next one.
                horizon: pageGroups[merged.horizonRowsKept - 1]?.cursor ?? requested.horizon,
                receipts: merged.position,
            };
        } catch (error) {
            // A missing transfer is a gap in the list, not a broken account.
            console.warn('Stellar: failed to read contract-token receipts', error);
        }
    };

    await applyContractTokenReceipts();

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: { ...account, stellarCursor: formatStellarPageCursor(cursor) },
    } as const;
};
