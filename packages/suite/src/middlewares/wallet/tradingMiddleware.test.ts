import { type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';
import { combineReducers } from 'redux';

import { type SelectedAccountState, selectedAccountReducer } from '@suite/account';
import { MODAL_CONTEXT_NONE, type State as ModalState, modalReducer } from '@suite/modal';
import {
    type LocationChangePayload,
    type RouterState,
    getRoute,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type TradingState,
    initialState,
    prepareTradingReducer,
    tradeApi,
    tradingActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { type AccountsState, prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import { type AccountKey, type SelectedAccountStatus } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { ACCOUNT } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/store';
import { tradingMiddleware } from 'src/middlewares/wallet/tradingMiddleware';
import suiteReducer, { type SuiteState } from 'src/reducers/suite/suiteReducer';

import { tradingMiddlewareFixtures } from './__fixtures__/tradingMiddleware';

jest.mock('@suite-common/trading', () => {
    const originalModule = jest.requireActual('@suite-common/trading');

    return {
        __esModule: true,
        ...originalModule,
        tradeApi: {
            createApiKey: jest.fn(),
        },
    };
});

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});
type StoreState = {
    wallet: {
        trading: TradingState;
        selectedAccount: SelectedAccountState;
        accounts: AccountsState;
    };
    suite: SuiteState;
    router: RouterState;
    modal: ModalState;
};
const accounts = [ACCOUNT];

interface Args {
    trading?: TradingState;
    selectedAccount?: SelectedAccountStatus;
    settings?: SuiteState;
    router?: RouterState;
    modal?: ModalState;
}

const getRequiredRoute = <TName extends NonNullable<LocationChangePayload['route']>['name']>(
    name: TName,
) => {
    const route = getRoute(name);

    if (!route) {
        throw new Error(`Missing route ${name}`);
    }

    return route as Extract<NonNullable<LocationChangePayload['route']>, { name: TName }>;
};

type State = {
    wallet: {
        trading: Partial<TradingState>;
        selectedAccount: SelectedAccountStatus;
        accounts: AccountsState;
    };
    suite: { settings: { debug: { tradeServerEnvironment: 'dev' } } };
    router: RouterState;
    modal: ModalState;
};

const getInitialState = ({ trading, selectedAccount, router }: Args = {}): State => ({
    wallet: {
        trading: trading ?? {
            isLoading: false,
            lastLoadedTimestamp: 0,
        },
        selectedAccount:
            selectedAccount ??
            ({
                status: 'loaded',
                account: ACCOUNT,
            } as SelectedAccountStatus),
        accounts,
    },
    suite: {
        settings: {
            debug: {
                tradeServerEnvironment: 'dev',
            },
        },
    },
    router: router ?? routerReducer(tradingMiddlewareFixtures.DEFAULT_ROUTE, { type: 'init' }),
    modal: modalReducer({ context: MODAL_CONTEXT_NONE }, { type: 'init' }),
});

const initStore = (state: State) => {
    const { settings } = state.suite;
    const { trading, selectedAccount } = state.wallet;

    return createTestCompositionRoot<void, StoreState>({
        reducer: combineReducers({
            wallet: combineReducers({
                trading: tradingReducer,
                selectedAccount: selectedAccountReducer,
                accounts: accountsReducer,
            }),
            suite: suiteReducer,
            router: routerReducer,
            modal: modalReducer,
        }),
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    ...trading,
                },
                selectedAccount,
                accounts,
            },
            suite: {
                settings,
            },
            router: state.router ? { ...state.router } : {},
            modal: state.modal ? { ...state.modal } : {},
        },
        middleware: [tradingMiddleware],
    }).services.store;
};

describe('tradingMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockedModalAccountKey = mockAccountKey({ descriptor: 'mockedKey' });
    const mockedModalCryptoId = 'bitcoin' as CryptoId;

    it.each<
        [
            string,
            { accountKey: AccountKey | undefined; cryptoId: CryptoId | undefined },
            LocationChangePayload,
        ]
    >([
        [
            'should stay modalAccountKey stable and modalCryptoId stable',
            { accountKey: mockedModalAccountKey, cryptoId: mockedModalCryptoId },
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
        ],
        [
            'should clean modalAccountKey and modalCryptoId when trading is abandoned',
            { accountKey: undefined, cryptoId: undefined },
            {
                ...tradingMiddlewareFixtures.DEFAULT_ROUTE,
                pathname: '/',
                app: 'dashboard',
                route: getRequiredRoute('suite-index'),
                params: { modal: undefined, networkSymbol: undefined },
            },
        ],
    ])('%s', (_, result, routeChange) => {
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    modalAccountKey: mockedModalAccountKey,
                    modalCryptoId: mockedModalCryptoId,
                },
                router: routerReducer(tradingMiddlewareFixtures.TRADING_SELL_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        // go away from trading
        store.dispatch(routerLocationChange({ ...routeChange }));

        expect(store.getState().wallet.trading.modalCryptoId).toEqual(result.cryptoId);
        expect(store.getState().wallet.trading.modalAccountKey).toEqual(result.accountKey);
    });

    type TradingRouterTestFixture = [
        string,
        { cryptoId: CryptoId | undefined; key: AccountKey | undefined },
        RouterState,
        LocationChangePayload,
    ];
    it.each<TradingRouterTestFixture>([
        [
            'should keep prefilledFromAccount when route is changed from sell to buy',
            {
                cryptoId: 'bitcoin' as CryptoId,
                key: 'descriptor' as AccountKey,
            },
            tradingMiddlewareFixtures.TRADING_BUY_ROUTE,
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
        ],
        [
            'should keep prefilledFromAccount when route is changed from buy to sell',
            {
                cryptoId: 'bitcoin' as CryptoId,
                key: 'descriptor' as AccountKey,
            },
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
            tradingMiddlewareFixtures.TRADING_BUY_ROUTE,
        ],
        [
            'should clean prefilledFromCryptoId when route is trading abandoned',
            {
                cryptoId: undefined,
                key: undefined,
            },
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
            tradingMiddlewareFixtures.DEFAULT_ROUTE,
        ],
        [
            'should prefilledFromCryptoId stay stable when is page changed to the same',
            {
                cryptoId: 'bitcoin' as CryptoId,
                key: 'descriptor' as AccountKey,
            },
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
        ],
    ])('%s', (_, result, routeDefault, routeChange) => {
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    prefilledFromAccount: {
                        cryptoId: 'bitcoin' as CryptoId,
                        key: 'descriptor' as AccountKey, // Todo: create properly via `createAccountKey()`
                    },
                },
                router: routerReducer(routeDefault, { type: 'init' }),
            }),
        );

        store.dispatch(routerLocationChange({ ...routeChange }));

        expect(store.getState().wallet.trading.prefilledFromAccount).toEqual(result);
    });

    it('should keep trading account keys when route is changed between non-trading routes', () => {
        const boundAccountKey = mockAccountKey({ descriptor: 'boundaccountkey' });
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    buy: { ...initialState.buy, tradingAccountKey: boundAccountKey },
                    sell: { ...initialState.sell, tradingAccountKey: boundAccountKey },
                    exchange: { ...initialState.exchange, tradingAccountKey: boundAccountKey },
                },
                router: routerReducer(tradingMiddlewareFixtures.WALLET_INDEX_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        store.dispatch(routerLocationChange({ ...tradingMiddlewareFixtures.DEFAULT_ROUTE }));

        const { buy, sell, exchange } = store.getState().wallet.trading;

        expect([buy.tradingAccountKey, sell.tradingAccountKey, exchange.tradingAccountKey]).toEqual(
            [boundAccountKey, boundAccountKey, boundAccountKey],
        );
    });

    it('should reset trading account keys when a trading form is entered from outside the trading section', () => {
        const boundAccountKey = mockAccountKey({ descriptor: 'boundaccountkey' });
        const prefilledAccountKey = mockAccountKey({ descriptor: 'prefilledaccountkey' });
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    exchange: { ...initialState.exchange, tradingAccountKey: boundAccountKey },
                    prefilledFromAccount: { key: prefilledAccountKey, cryptoId: undefined },
                },
                router: routerReducer(tradingMiddlewareFixtures.WALLET_INDEX_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        store.dispatch(
            routerLocationChange({ ...tradingMiddlewareFixtures.TRADING_EXCHANGE_ROUTE }),
        );

        const { exchange, prefilledFromAccount } = store.getState().wallet.trading;

        expect(exchange.tradingAccountKey).toBeUndefined();
        expect(prefilledFromAccount.key).toBe(prefilledAccountKey);
    });

    it('should keep trading account keys when a confirm route is entered from outside the trading section', () => {
        const boundAccountKey = mockAccountKey({ descriptor: 'boundaccountkey' });
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    exchange: { ...initialState.exchange, tradingAccountKey: boundAccountKey },
                },
                router: routerReducer(tradingMiddlewareFixtures.WALLET_INDEX_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        store.dispatch(
            routerLocationChange({ ...tradingMiddlewareFixtures.TRADING_EXCHANGE_CONFIRM_ROUTE }),
        );

        expect(store.getState().wallet.trading.exchange.tradingAccountKey).toBe(boundAccountKey);
    });

    it('should reset trading account keys when the trading redirect is entered from outside the trading section', () => {
        const boundAccountKey = mockAccountKey({ descriptor: 'boundaccountkey' });
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    exchange: { ...initialState.exchange, tradingAccountKey: boundAccountKey },
                },
                router: routerReducer(tradingMiddlewareFixtures.WALLET_INDEX_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        store.dispatch(
            routerLocationChange({ ...tradingMiddlewareFixtures.TRADING_REDIRECT_ROUTE }),
        );

        expect(store.getState().wallet.trading.exchange.tradingAccountKey).toBeUndefined();
    });

    it('should keep the quote request prepared by the trading redirect when the form is entered', () => {
        const prefilledAccountKey = mockAccountKey({ descriptor: 'prefilledaccountkey' });
        const quotesRequest: BuyTradeQuoteRequest = {
            wantCrypto: false,
            fiatCurrency: 'EUR',
            receiveCurrency: 'bitcoin' as CryptoId,
            fiatStringAmount: '10',
            country: 'CZ',
        };
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    buy: { ...initialState.buy, quotesRequest },
                    prefilledFromAccount: { key: prefilledAccountKey, cryptoId: undefined },
                },
                router: routerReducer(tradingMiddlewareFixtures.TRADING_REDIRECT_ROUTE, {
                    type: 'init',
                }),
            }),
        );

        store.dispatch(routerLocationChange({ ...tradingMiddlewareFixtures.TRADING_BUY_ROUTE }));

        expect(store.getState().wallet.trading.buy.quotesRequest).toEqual(quotesRequest);
        expect(store.getState().wallet.trading.buy.tradingAccountKey).toBe(prefilledAccountKey);
    });

    it.each([
        ['sell' as const, 'buy' as const, tradingMiddlewareFixtures.TRADING_BUY_ROUTE],
        ['buy' as const, 'sell' as const, tradingMiddlewareFixtures.TRADING_SELL_ROUTE],
    ])(
        'should not carry the %s account key over to %s when the form is entered from outside the trading section',
        (source, target, route) => {
            const boundAccountKey = mockAccountKey({ descriptor: 'boundaccountkey' });
            const trading: TradingState = {
                ...initialState,
                [source]: { ...initialState[source], tradingAccountKey: boundAccountKey },
            };
            const store = initStore(
                getInitialState({
                    trading,
                    router: routerReducer(tradingMiddlewareFixtures.WALLET_INDEX_ROUTE, {
                        type: 'init',
                    }),
                }),
            );

            store.dispatch(routerLocationChange({ ...route }));

            expect(store.getState().wallet.trading[target].tradingAccountKey).toBeUndefined();
            expect(store.getState().wallet.trading[source].tradingAccountKey).toBeUndefined();
        },
    );

    it.each([
        ['buy' as const, tradingMiddlewareFixtures.TRADING_BUY_ROUTE],
        ['sell' as const, tradingMiddlewareFixtures.TRADING_SELL_ROUTE],
        ['exchange' as const, tradingMiddlewareFixtures.TRADING_EXCHANGE_ROUTE],
    ])(
        'should set activeSection to %s and clean transaction id when route is changed',
        (section, route) => {
            const store = initStore(
                getInitialState({
                    trading: {
                        ...initialState,
                    },
                    router: {
                        ...getInitialState().router,
                    },
                }),
            );

            // go to trading
            store.dispatch(routerLocationChange({ ...route }));

            expect(store.getState().wallet.trading.activeSection).toEqual(section);
            expect(store.getState().wallet.trading[section].transactionId).toBeUndefined();
        },
    );

    it('should set buy trading and receive account keys from prefilled account on buy route', () => {
        const accountKey = mockAccountKey({ descriptor: 'prefilledaccountkey' });
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    prefilledFromAccount: {
                        cryptoId: 'bitcoin' as CryptoId,
                        key: accountKey,
                    },
                },
                router: {
                    ...getInitialState().router,
                },
            }),
        );

        store.dispatch(routerLocationChange({ ...tradingMiddlewareFixtures.TRADING_BUY_ROUTE }));

        expect(store.getState().wallet.trading.buy.tradingAccountKey).toEqual(accountKey);
        expect(store.getState().wallet.trading.buy.receiveAccountKey).toEqual(accountKey);
    });

    it.each([
        [tradingExchangeActions.setTradingAccountKey.type, 'exchange' as const],
        [tradingSellActions.setTradingAccountKey.type, 'sell' as const],
    ])('should create new invity API key when action %s is called', (action, section) => {
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                },
                router: {
                    ...getInitialState().router,
                },
            }),
        );

        // go to trading
        store.dispatch({
            type: action,
            payload: 'btc-descriptor',
        });

        expect(tradeApi.createApiKey).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading[section].tradingAccountKey).toEqual(
            'btc-descriptor',
        );
    });

    it.each([
        ['exchange' as const, 1],
        ['sell' as const, 1],
        ['buy' as const, 0],
    ])(
        'should create new invity API key when the %s section is bound to an account',
        (type, calls) => {
            const store = initStore(
                getInitialState({
                    trading: {
                        ...initialState,
                    },
                    router: {
                        ...getInitialState().router,
                    },
                }),
            );

            store.dispatch(
                tradingActions.bindTradingAccount({
                    type,
                    accountKey: 'btc-descriptor' as AccountKey,
                }),
            );

            expect(tradeApi.createApiKey).toHaveBeenCalledTimes(calls);
        },
    );
});
