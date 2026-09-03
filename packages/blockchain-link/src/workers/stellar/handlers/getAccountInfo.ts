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

    const pageGroups = await dataSource.readAccountHistory({
        descriptor: payload.descriptor,
        pageSize: payload.pageSize || DEFAULT_TXS_PER_PAGE,
        cursor: payload.page && payload.page !== 1 ? payload.pageCursor : undefined,
    });

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
