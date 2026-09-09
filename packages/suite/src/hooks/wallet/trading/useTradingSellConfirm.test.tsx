import type { CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { sellInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSellConfirm } from './useTradingSellConfirm';

jest.mock('src/hooks/wallet/trading/useServerEnviroment', () => ({
    useServerEnvironment: jest.fn(),
}));

const mockLoadInitialDataThunk = jest.fn((args: unknown) =>
    Object.assign(() => Promise.resolve(), { type: '@trading/loadInitialData', args }),
);

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        tradingThunks: {
            ...actual.tradingThunks,
            loadInitialDataThunk: (args: unknown) => mockLoadInitialDataThunk(args),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const EURO_FIAT_CURRENCY = 'EUR' as FiatCurrencyCode;

const SELECTED_QUOTE: SellFiatTrade = {
    fiatStringAmount: '47.12',
    fiatCurrency: EURO_FIAT_CURRENCY,
    cryptoCurrency: BITCOIN_CRYPTO_ID,
    cryptoStringAmount: '0.004',
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    exchange: 'cexdirect',
    paymentMethod: 'bankTransfer',
};

const QUOTES_REQUEST = {
    fiatCurrency: EURO_FIAT_CURRENCY,
    cryptoCurrency: BITCOIN_CRYPTO_ID,
    amountInCrypto: true,
};

type StateOverrides = {
    selectedQuote?: SellFiatTrade | undefined;
    quotesRequest?: typeof QUOTES_REQUEST | undefined;
    accountKey?: Account['key'] | undefined;
    accounts?: Account[];
};

const buildState = (overrides: StateOverrides = {}) => {
    const selectedQuote = 'selectedQuote' in overrides ? overrides.selectedQuote : SELECTED_QUOTE;
    const quotesRequest = 'quotesRequest' in overrides ? overrides.quotesRequest : QUOTES_REQUEST;
    const accountKey = 'accountKey' in overrides ? overrides.accountKey : ACCOUNT.key;
    const accounts = 'accounts' in overrides ? overrides.accounts : [ACCOUNT];

    const overridesForSell = {
        selectedQuote,
        quotesRequest,
        tradingAccountKey: accountKey,
    };

    return {
        wallet: {
            accounts,
            trading: {
                ...tradingInitialState,
                sell: { ...sellInitialState, ...overridesForSell },
            },
        },
    };
};

const renderConfirm = (overrides?: StateOverrides) => {
    const state = buildState(overrides);

    const suiteRouterHistory = { ...mockSuiteRouterHistory(), navigate: jest.fn() };
    const root = createTestCompositionRoot({
        extra: {
            services: { suiteRouterHistory },
        },
        preloadedState: state,
        reducer: {
            router: routerReducer,
            locks: locksReducer,
            modal: modalReducer,
            wallet: (wallet = state.wallet) => wallet,
        },
    });
    const { result } = renderHookWithStoreProvider(() => useTradingSellConfirm(), { root });

    return { root, result, suiteRouterHistory };
};

describe('useTradingSellConfirm', () => {
    beforeEach(() => {
        mockLoadInitialDataThunk.mockClear();
    });

    describe('initialization', () => {
        it('loads sell initial data on mount', () => {
            renderConfirm();

            expect(mockLoadInitialDataThunk).toHaveBeenCalledWith({ activeSection: 'sell' });
        });
    });

    describe('readiness guard', () => {
        it('does not redirect when the quotes request is present', () => {
            const { suiteRouterHistory } = renderConfirm();

            expect(suiteRouterHistory.navigate).not.toHaveBeenCalled();
        });

        it('redirects to the sell form when the quotes request is missing', () => {
            const { suiteRouterHistory } = renderConfirm({ quotesRequest: undefined });

            expect(suiteRouterHistory.navigate).toHaveBeenCalledWith({
                pathname: '/accounts/coinmarket/sell',
                hash: '',
            });
        });
    });
});
