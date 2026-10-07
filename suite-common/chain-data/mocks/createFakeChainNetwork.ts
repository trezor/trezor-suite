import {
    type ChainNetwork,
    type ChainTokenBalance,
    type ChainTransactionsPage,
    type FiatRate,
    type HistoricFiatRates,
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
    };

    return {
        network,
        getAccountBalance,
        getNativeFiatRate,
        getTokens,
        getTokenFiatRate,
        getTransactions,
        getHistoricFiatRates,
    };
};
