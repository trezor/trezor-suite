import type { ChainAccountRef } from './ChainAccountRef';
import type { ChainNativeAsset, ChainNetwork, ChainNetworkParams } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';
import { getChainSyncPolicy } from './ChainSyncPolicy';
import type { FetchCurrentFiatRate, FetchHistoricFiatRates } from './FiatRate';
import type {
    FetchConnectAccountBalance,
    FetchConnectAccountBalanceParams,
} from './createFetchConnectAccountBalance';
import type { FetchConnectTokens, FetchConnectTokensParams } from './createFetchConnectTokens';
import type {
    FetchConnectTransactions,
    FetchConnectTransactionsParams,
} from './createFetchConnectTransactions';
import { getDisplayBalanceFiatValue } from './getDisplayBalanceFiatValue';
import type { ChainNetworkSendDefinition } from './send/ChainSend';
import { buildPendingTransaction } from './send/buildPendingTransaction';
import { createPrepareReplacementForReview } from './send/prepareReplacementForReview';

const prepareReplacementForReview = createPrepareReplacementForReview({ useNativeRbf: false });

export type ConnectChainNetworkTokens = {
    fetchTokens: FetchConnectTokens;
    fungibleStandards: FetchConnectTokensParams['fungibleStandards'];
    details: FetchConnectTokensParams['details'];
    watchedTokensStrategy: FetchConnectTokensParams['watchedTokensStrategy'];

    /** `null` when no token of the network has a fiat value (testnets). */
    fetchTokenFiatRate: FetchCurrentFiatRate | null;
};

export type ConnectChainNetworkTransactions = Pick<
    FetchConnectTransactionsParams,
    'pagination' | 'pageSize' | 'useStellarContractTokens' | 'protocols'
> & {
    fetchTransactions: FetchConnectTransactions;
};

export type ConnectChainNetworkDefinition = {
    params: ChainNetworkParams;
    nativeAsset: ChainNativeAsset;
    decimals: number;
    accountSyncIntervalMs: number;
    displayBalance: FetchConnectAccountBalanceParams['displayBalance'];
    useConnectionIdentity: boolean;
    fetchAccountBalance: FetchConnectAccountBalance;

    /** `null` when the network has no fiat value at all (testnets). */
    fetchFiatRate: FetchCurrentFiatRate | null;
    getAccountFiatBalance?: ChainNetwork['getAccountFiatBalance'];

    /** Only for networks with tokens; without it the network has no token capabilities. */
    tokens?: ConnectChainNetworkTokens;

    /** Only for backends that keep history; without it the network has no history. */
    transactions?: ConnectChainNetworkTransactions;

    /** Past rates of the coin and its tokens; `null` when they have no fiat value (testnets). */
    fetchHistoricFiatRates: FetchHistoricFiatRates | null;

    /** Composing, signing and broadcasting; without it the network cannot send. */
    send?: ChainNetworkSendDefinition;
};

/**
 * Assembles a network whose accounts are read through Connect. Network packages state only what
 * differs between them (decimals, displayed balance, rate source); the wiring is shared.
 */
export const buildConnectChainNetwork = (
    definition: ConnectChainNetworkDefinition,
): ChainNetwork => {
    const { symbol } = definition.params;
    const { fetchFiatRate, fetchHistoricFiatRates, tokens, transactions, send } = definition;

    const assertOwnAccount = (ref: Pick<ChainAccountRef, 'symbol'>) => {
        if (ref.symbol !== symbol) {
            throw new ChainNetworkError('symbol-mismatch', symbol);
        }
    };

    const network: ChainNetwork = {
        symbol,
        backendType: definition.params.backend.type,
        syncPolicy: getChainSyncPolicy(definition.accountSyncIntervalMs),
        nativeAsset: definition.nativeAsset,
        getAccountBalance: async params => {
            assertOwnAccount(params.ref);

            return await definition.fetchAccountBalance({
                ...params,
                decimals: definition.decimals,
                displayBalance: definition.displayBalance,
                useConnectionIdentity: definition.useConnectionIdentity,
                gap: definition.params.gapLimit,
            });
        },
        getNativeFiatRate: async params =>
            fetchFiatRate ? await fetchFiatRate({ ...params, symbol }) : null,
        getAccountFiatBalance: definition.getAccountFiatBalance ?? getDisplayBalanceFiatValue,
        getHistoricFiatRates: async params =>
            fetchHistoricFiatRates
                ? await fetchHistoricFiatRates({
                      symbol,
                      currency: params.currency,
                      timestamps: params.timestamps,
                      signal: params.signal,
                      tokenAddress: params.contract,
                  })
                : {},
        ...(transactions && {
            getTransactions: async params => {
                assertOwnAccount(params.ref);

                return await transactions.fetchTransactions({
                    ...params,
                    pagination: transactions.pagination,
                    pageSize: transactions.pageSize,
                    useStellarContractTokens: transactions.useStellarContractTokens,
                    protocols: transactions.protocols,
                    useConnectionIdentity: definition.useConnectionIdentity,
                    gap: definition.params.gapLimit,
                });
            },
        }),
        ...(send && {
            send: {
                composeFeeLevels: async params => {
                    assertOwnAccount(params.account);

                    return await send.composeFeeLevels(params);
                },
                prepareForReview: async params => {
                    assertOwnAccount(params.account);

                    return await (send.prepareForReview ?? prepareReplacementForReview)(params);
                },
                sign: async params => {
                    assertOwnAccount(params.account);

                    return await send.sign(params);
                },
                push: async params => {
                    assertOwnAccount(params.account);

                    return await send.push(params);
                },
                createPendingTransaction: params => {
                    assertOwnAccount(params.account);

                    return (send.createPendingTransaction ?? buildPendingTransaction)(params);
                },
            },
        }),
    };

    if (!tokens) return network;

    const { fetchTokenFiatRate } = tokens;

    return {
        ...network,
        getTokens: async params => {
            assertOwnAccount(params.ref);

            return await tokens.fetchTokens({
                ...params,
                fungibleStandards: tokens.fungibleStandards,
                details: tokens.details,
                watchedTokensStrategy: tokens.watchedTokensStrategy,
                useConnectionIdentity: definition.useConnectionIdentity,
            });
        },
        getTokenFiatRate: async params =>
            fetchTokenFiatRate
                ? await fetchTokenFiatRate({
                      symbol,
                      currency: params.currency,
                      signal: params.signal,
                      tokenAddress: params.contract,
                  })
                : null,
    };
};
