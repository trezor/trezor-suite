import type { AccountInfo, MessageTypes, TokenInfo } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_CONTRACT_TOKENS, STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import type { Request } from '../types';

const DEFAULT_TXS_PER_PAGE = 20;

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
    isTestnet: boolean,
) => {
    const { payload } = request;
    const baseReserve = new BigNumber(await request.getBaseReserve());

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
        identifyTransaction,
        isValidContractId,
        parseClassicAssetContract,
        readSep41Tokens,
    } = await stellar();
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

    // Soroban contract (type-C / SEP-41) tokens.
    // Neither Horizon nor a ledger-entry lookup can see these, so they are read from the
    // contract itself over RPC. Tokens are self-describing: balance + metadata
    // (decimals/symbol/name) come from each contract's SEP-41 interface. There is no on-chain
    // registry of contract-token holdings, so the contracts to read are a curated list plus
    // whatever the user added themselves.
    // Enabled on mainnet only (the PoC RPC endpoint is mainnet).
    const watchedContracts = payload.stellarContractTokens ?? [];

    // A Stellar Asset Contract mirrors a classic trustline balance already reported above, so a
    // watched SAC of an asset the account holds would double-count the holding.
    const classicSacIds = new Set(
        (account.tokens ?? []).flatMap(token => {
            try {
                return [computeSorobanAssetContractId(token.contract).sorobanAssetContractId];
            } catch {
                return [];
            }
        }),
    );
    // The hosted definitions are the allow-list; the curated constants stay until that pipeline
    // carries contract tokens.
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
                    // The curated list is only a discovery hint, so surface just the ones the
                    // account actually holds. A contract the user added stays visible at a zero
                    // balance, the way an opted-in trustline does.
                    .filter(token => token.balance !== '0' || watched.has(token.contract))
                    .flatMap((token): TokenInfo[] => {
                        // Prefer on-chain SEP-41 metadata; fall back to the curated entry.
                        const fallback = fallbackByContract.get(token.contract);
                        const decimals = token.decimals ?? fallback?.decimals;

                        // Without decimals the balance cannot be scaled, and defaulting to the
                        // classic 7 would render an 18-decimal holding 10^11 times too large.
                        // A token that cannot describe itself is left out until it can.
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

    const pageGroups = await dataSource.readAccountHistory({
        descriptor: payload.descriptor,
        pageSize: payload.pageSize || DEFAULT_TXS_PER_PAGE,
        cursor: payload.page && payload.page !== 1 ? payload.pageCursor : undefined,
    });

    // Horizon operation ids are TOIDs, whose high 32 bits are the ledger sequence:
    // https://github.com/stellar/go/blob/master/services/horizon/internal/docs/reference/toid.md
    const toLedgerSequence = (operationId: string) => {
        try {
            return Number(BigInt(operationId) >> 32n);
        } catch {
            return 0;
        }
    };

    // Everything `transformTransaction` needs for an `unknown` transaction, read off the
    // operation alone — the transaction record is exactly what is unavailable here. This is the
    // fallback of a parse that already failed, so every field it reads is one a degraded record
    // may not carry: it has to produce a row for anything at all rather than throw in turn,
    // which would take down the whole page it exists to keep intact.
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
                // A single unparseable record must not fail the whole account history, and must
                // not shorten the page either: a short page reads as the end of the history, and
                // the empty slot it leaves keeps the page from ever counting as fetched. So the
                // record keeps its slot as an `unknown` transaction, the same shape an
                // unrecognised operation already produces.
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
