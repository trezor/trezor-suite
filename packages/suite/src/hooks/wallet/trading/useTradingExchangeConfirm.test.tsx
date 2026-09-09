import { type UnknownAction } from '@reduxjs/toolkit';
import type { CryptoId, ExchangeTrade } from 'invity-api';

import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { exchangeInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeConfirm } from './useTradingExchangeConfirm';

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
    const { result } = renderHookWithStoreProvider(() => useTradingExchangeConfirm(), { root });

    const { getActions } = root.services;

    return { getActions, result, suiteRouterHistory };
};

const exchangeActions = (actions: UnknownAction[]) =>
    actions.filter(action => action.type?.startsWith('@trading-exchange/'));

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
            const { suiteRouterHistory } = renderConfirm();

            expect(suiteRouterHistory.navigate).not.toHaveBeenCalled();
        });

        it('redirects to the exchange form when the quotes request is missing', () => {
            const { suiteRouterHistory } = renderConfirm({ quotesRequest: undefined });

            expect(suiteRouterHistory.navigate).toHaveBeenCalledWith({
                pathname: '/accounts/coinmarket/exchange',
                hash: '',
            });
        });
    });

    describe('redirect restoration', () => {
        it('restores the quote, step and account and clears the redirect flag on return', () => {
            const { getActions } = renderConfirm({
                isFromRedirect: true,
                transactionId: REDIRECT_ORDER_ID,
                trades: [REDIRECT_TRADE],
            });

            expect(exchangeActions(getActions())).toEqual([
                tradingExchangeActions.saveSelectedQuote(REDIRECT_TRADE.data),
                tradingExchangeActions.setFormStep('SEND_TRANSACTION'),
                tradingExchangeActions.setTradingAccountKey(REDIRECT_TRADE.sendAccountKey),
                tradingExchangeActions.setIsFromRedirect(false),
            ]);
        });

        it('only clears the redirect flag when no active trade is resolved', () => {
            const { getActions } = renderConfirm({ isFromRedirect: true });

            expect(exchangeActions(getActions())).toEqual([
                tradingExchangeActions.setIsFromRedirect(false),
            ]);
        });

        it('does not dispatch redirect actions when not returning from a redirect', () => {
            const { getActions } = renderConfirm({
                transactionId: REDIRECT_ORDER_ID,
                trades: [REDIRECT_TRADE],
            });

            expect(exchangeActions(getActions())).toHaveLength(0);
        });
    });
});
