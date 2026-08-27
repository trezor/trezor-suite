import type { CryptoId, ExchangeTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { exchangeInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeConfirm } from './useTradingExchangeConfirm';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
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

const { tradingExchangeActions } = jest.requireActual('@suite-common/trading');

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;

const SELECTED_QUOTE: ExchangeTrade = {
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    exchange: 'changelly',
    send: ETHEREUM_CRYPTO_ID,
    receive: BITCOIN_CRYPTO_ID,
    sendStringAmount: '1',
    receiveStringAmount: '0.05',
};

const QUOTES_REQUEST = {
    send: ETHEREUM_CRYPTO_ID,
    receive: BITCOIN_CRYPTO_ID,
};

const REDIRECT_ORDER_ID = 'a1b2c3d4-order';

const REDIRECT_TRADE = {
    date: '2026-01-01T00:00:00.000Z',
    key: 'exchange-key',
    tradeType: 'exchange',
    data: { ...SELECTED_QUOTE, orderId: REDIRECT_ORDER_ID, status: 'CONFIRMING' },
    sendAccountKey: ACCOUNT.key,
} as const;

type StateOverrides = {
    selectedQuote?: ExchangeTrade | undefined;
    quotesRequest?: typeof QUOTES_REQUEST | undefined;
    accountKey?: Account['key'] | undefined;
    accounts?: Account[];
    isFromRedirect?: boolean;
    transactionId?: string | undefined;
    trades?: Array<typeof REDIRECT_TRADE>;
};

const buildState = (overrides: StateOverrides = {}) => {
    const selectedQuote = 'selectedQuote' in overrides ? overrides.selectedQuote : SELECTED_QUOTE;
    const quotesRequest = 'quotesRequest' in overrides ? overrides.quotesRequest : QUOTES_REQUEST;
    const accountKey = 'accountKey' in overrides ? overrides.accountKey : ACCOUNT.key;
    const accounts = 'accounts' in overrides ? overrides.accounts : [ACCOUNT];
    const isFromRedirect = 'isFromRedirect' in overrides ? overrides.isFromRedirect : false;
    const transactionId = 'transactionId' in overrides ? overrides.transactionId : undefined;
    const trades = 'trades' in overrides ? overrides.trades : [];

    const overridesForExchange = {
        selectedQuote,
        quotesRequest,
        isFromRedirect,
        transactionId,
        tradingAccountKey: accountKey,
    };

    return {
        wallet: {
            accounts,
            trading: {
                ...tradingInitialState,
                trades,
                exchange: { ...exchangeInitialState, ...overridesForExchange },
            },
        },
    };
};

const renderConfirm = (overrides?: StateOverrides) => {
    const state = buildState(overrides);

    const store = configureMockStore({ extra: undefined, preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingExchangeConfirm(), { store });

    return { store, result };
};

const gotoActions = (store: ReturnType<typeof renderConfirm>['store']) =>
    store.getActions().filter(action => action.type === '@router/goto');

const exchangeActions = (store: ReturnType<typeof renderConfirm>['store']) =>
    store.getActions().filter(action => action.type?.startsWith('@trading-exchange/'));

describe('useTradingExchangeConfirm', () => {
    beforeEach(() => {
        mockLoadInitialDataThunk.mockClear();
    });

    describe('initialization', () => {
        it('loads exchange initial data on mount', () => {
            renderConfirm();

            expect(mockLoadInitialDataThunk).toHaveBeenCalledWith({ activeSection: 'exchange' });
        });
    });

    describe('readiness guard', () => {
        it('does not redirect when the quotes request is present', () => {
            const { store } = renderConfirm();

            expect(gotoActions(store)).toHaveLength(0);
        });

        it('redirects to the exchange form when the quotes request is missing', () => {
            const { store } = renderConfirm({ quotesRequest: undefined });

            expect(gotoActions(store)).toEqual([
                { type: '@router/goto', payload: { routeName: 'wallet-trading-exchange' } },
            ]);
        });
    });

    describe('redirect restoration', () => {
        it('restores the quote, step and account and clears the redirect flag on return', () => {
            const { store } = renderConfirm({
                isFromRedirect: true,
                transactionId: REDIRECT_ORDER_ID,
                trades: [REDIRECT_TRADE],
            });

            expect(exchangeActions(store)).toEqual([
                tradingExchangeActions.saveSelectedQuote(REDIRECT_TRADE.data),
                tradingExchangeActions.setFormStep('SEND_TRANSACTION'),
                tradingExchangeActions.setTradingAccountKey(REDIRECT_TRADE.sendAccountKey),
                tradingExchangeActions.setIsFromRedirect(false),
            ]);
        });

        it('only clears the redirect flag when no active trade is resolved', () => {
            const { store } = renderConfirm({ isFromRedirect: true });

            expect(exchangeActions(store)).toEqual([
                tradingExchangeActions.setIsFromRedirect(false),
            ]);
        });

        it('does not dispatch redirect actions when not returning from a redirect', () => {
            const { store } = renderConfirm({
                transactionId: REDIRECT_ORDER_ID,
                trades: [REDIRECT_TRADE],
            });

            expect(exchangeActions(store)).toHaveLength(0);
        });
    });
});
