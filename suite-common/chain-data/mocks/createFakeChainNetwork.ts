import {
    type ChainNetwork,
    type ChainTokenBalance,
    type FiatRate,
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
        ...(params.tokens ? { getTokens, getTokenFiatRate } : {}),
    };

    return { network, getAccountBalance, getNativeFiatRate, getTokens, getTokenFiatRate };
};
