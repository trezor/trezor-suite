import {
    type ChainAccountNonce,
    type ChainNetwork,
    type ChainTokenBalance,
    type ChainTransactionsPage,
    type FeeInfo,
    type FiatRate,
    type HistoricFiatRates,
    buildPendingTransaction,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

type FakeChainNetworkParams = {
    symbol: NetworkSymbol;
    /** Display symbol of the native coin; the network symbol upper-cased when left out. */
    nativeSymbol?: string;
    /** Display balance by descriptor. */
    balances: Record<string, string>;
    rate: FiatRate | null;
    /** Tokens by descriptor; a network without it has no token capabilities. */
    tokens?: Record<string, readonly ChainTokenBalance[]>;
    /** Token rates by contract. */
    tokenRates?: Record<string, FiatRate | null>;
    /** History pages by descriptor; a network without it has no history. */
    history?: Record<string, readonly ChainTransactionsPage[]>;
    /** Past rates by contract, `''` for the coin. */
    historicRates?: Record<string, HistoricFiatRates>;

    /** Whether the network can send; its send answers with spies set up by the test. */
    canSend?: boolean;

    /** Fee levels the network quotes itself, as runtime networks do; none when left out. */
    feeInfo?: FeeInfo;

    /** The accounts' nonce; a network without it has no account nonces. */
    accountNonce?: ChainAccountNonce;
};

/** A network answering from memory, with spies on what shared code asks it. */
export const createFakeChainNetwork = (params: FakeChainNetworkParams) => {
    const getAccountBalance = jest.fn<
        ReturnType<ChainNetwork['getAccountBalance']>,
        Parameters<ChainNetwork['getAccountBalance']>
    >(({ ref }) => {
        const displayBalance = params.balances[ref.descriptor] ?? '0';

        return Promise.resolve({
            balance: displayBalance,
            availableBalance: displayBalance,
            displayBalance,
            empty: displayBalance === '0',
        });
    });
    const getNativeFiatRate = jest.fn<
        ReturnType<ChainNetwork['getNativeFiatRate']>,
        Parameters<ChainNetwork['getNativeFiatRate']>
    >(() => Promise.resolve(params.rate));
    const getTokens = jest.fn<
        ReturnType<NonNullable<ChainNetwork['getTokens']>>,
        Parameters<NonNullable<ChainNetwork['getTokens']>>
    >(({ ref }) => Promise.resolve(params.tokens?.[ref.descriptor] ?? []));
    const getTokenFiatRate = jest.fn<
        ReturnType<NonNullable<ChainNetwork['getTokenFiatRate']>>,
        Parameters<NonNullable<ChainNetwork['getTokenFiatRate']>>
    >(({ contract }) => Promise.resolve(params.tokenRates?.[contract] ?? null));

    const getTransactions = jest.fn<
        ReturnType<NonNullable<ChainNetwork['getTransactions']>>,
        Parameters<NonNullable<ChainNetwork['getTransactions']>>
    >(({ ref, cursor }) => {
        const page = params.history?.[ref.descriptor]?.[cursor.page - 1];

        return Promise.resolve(page ?? { transactions: [], nextCursor: null, total: 0 });
    });
    const getHistoricFiatRates = jest.fn<
        ReturnType<ChainNetwork['getHistoricFiatRates']>,
        Parameters<ChainNetwork['getHistoricFiatRates']>
    >(({ contract, timestamps }) => {
        const rates = params.historicRates?.[contract ?? ''] ?? {};

        return Promise.resolve(
            Object.fromEntries(
                timestamps.flatMap(timestamp =>
                    rates[timestamp] === undefined ? [] : [[timestamp, rates[timestamp]]],
                ),
            ),
        );
    });

    const { accountNonce } = params;
    const getAccountNonce = jest.fn<
        ReturnType<NonNullable<ChainNetwork['getAccountNonce']>>,
        Parameters<NonNullable<ChainNetwork['getAccountNonce']>>
    >(() => (accountNonce ? Promise.resolve(accountNonce) : Promise.reject(new Error('No nonce'))));

    type Send = NonNullable<ChainNetwork['send']>;
    const { feeInfo } = params;
    const send = {
        composeFeeLevels: jest.fn<
            ReturnType<Send['composeFeeLevels']>,
            Parameters<Send['composeFeeLevels']>
        >(),
        prepareForReview: jest.fn<
            ReturnType<Send['prepareForReview']>,
            Parameters<Send['prepareForReview']>
        >(({ precomposed }) => Promise.resolve({ precomposed })),
        sign: jest.fn<ReturnType<Send['sign']>, Parameters<Send['sign']>>(),
        push: jest.fn<ReturnType<Send['push']>, Parameters<Send['push']>>(),
        createPendingTransaction: jest.fn<
            ReturnType<Send['createPendingTransaction']>,
            Parameters<Send['createPendingTransaction']>
        >(buildPendingTransaction),
        getFeeInfo: feeInfo
            ? jest.fn<Promise<FeeInfo>, []>(() => Promise.resolve(feeInfo))
            : undefined,
    };

    const network: ChainNetwork = {
        symbol: params.symbol,
        backendType: 'blockbook',
        syncPolicy: getChainSyncPolicy(60_000),
        nativeAsset: {
            symbol: params.nativeSymbol ?? params.symbol.toUpperCase(),
            name: params.symbol,
        },
        getAccountBalance,
        getNativeFiatRate,
        getAccountFiatBalance: getDisplayBalanceFiatValue,
        getHistoricFiatRates,
        ...(params.tokens ? { getTokens, getTokenFiatRate } : {}),
        ...(params.history ? { getTransactions } : {}),
        ...(accountNonce ? { getAccountNonce } : {}),
        ...(params.canSend ? { send } : {}),
    };

    return {
        network,
        getAccountBalance,
        getNativeFiatRate,
        getTokens,
        getTokenFiatRate,
        getTransactions,
        getHistoricFiatRates,
        getAccountNonce,
        send,
    };
};
