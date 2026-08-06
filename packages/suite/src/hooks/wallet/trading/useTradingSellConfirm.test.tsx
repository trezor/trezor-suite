import type { CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { sellInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSellConfirm } from './useTradingSellConfirm';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
}));

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

    const store = configureMockStore({ preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingSellConfirm(), { store });

    return { store, result };
};

const gotoActions = (store: ReturnType<typeof renderConfirm>['store']) =>
    store.getActions().filter(action => action.type === '@router/goto');

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
            const { store } = renderConfirm();

            expect(gotoActions(store)).toHaveLength(0);
        });

        it('redirects to the sell form when the quotes request is missing', () => {
            const { store } = renderConfirm({ quotesRequest: undefined });

            expect(gotoActions(store)).toEqual([
                { type: '@router/goto', payload: { routeName: 'wallet-trading-sell' } },
            ]);
        });
    });
});
