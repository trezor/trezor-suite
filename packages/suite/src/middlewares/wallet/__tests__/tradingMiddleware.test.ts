import { UnknownAction } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';
import { combineReducers } from 'redux';

import { MODAL_CONTEXT_NONE, State as ModalState, modalReducer } from '@suite/modal';
import { RouterState, getRoute, routerLocationChange, routerReducer } from '@suite/router';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    type TradingState,
    initialState,
    invityAPI,
    prepareTradingReducer,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { prepareAccountsReducer } from '@suite-common/wallet-core';
import { AccountKey, SelectedAccountStatus } from '@suite-common/wallet-types';

import { ACCOUNT } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/store';
import { tradingMiddlewareFixtures } from 'src/middlewares/wallet/__fixtures__/tradingMiddleware';
import { tradingMiddleware } from 'src/middlewares/wallet/tradingMiddleware';
import suiteReducer, { SuiteState } from 'src/reducers/suite/suiteReducer';
import { accounts } from 'src/reducers/wallet/__fixtures__/transactionConstants';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
jest.mock('@suite-common/trading', () => {
    const originalModule = jest.requireActual('@suite-common/trading');

    return {
        __esModule: true,
        ...originalModule,
        invityAPI: {
            createInvityAPIKey: jest.fn(),
        },
    };
});

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const accountsReducer = prepareAccountsReducer(extraDependenciesCommonMock);

interface Args {
    trading?: TradingState;
    selectedAccount?: SelectedAccountStatus;
    settings?: SuiteState;
    router?: RouterState;
    modal?: ModalState;
}

type LocationChangePayload = Parameters<typeof routerLocationChange>[0];

const getRequiredRoute = <TName extends NonNullable<LocationChangePayload['route']>['name']>(
    name: TName,
) => {
    const route = getRoute(name);

    if (!route) {
        throw new Error(`Missing route ${name}`);
    }

    return route as Extract<NonNullable<LocationChangePayload['route']>, { name: TName }>;
};

const getInitialState = ({ trading, selectedAccount, router }: Args = {}) => ({
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
                invityServerEnvironment: 'dev',
            },
        },
    },
    router:
        router ??
        routerReducer(tradingMiddlewareFixtures.DEFAULT_ROUTE, { type: 'init' } as UnknownAction),
    modal: modalReducer({ context: MODAL_CONTEXT_NONE }, { type: 'init' } as UnknownAction),
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const { settings } = state.suite;
    const { trading, selectedAccount } = state.wallet;

    const store = configureMockStore({
        extra: {},
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
    });

    return store;
};

describe('tradingMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each<[string, AccountKey | CryptoId | undefined, LocationChangePayload]>([
        [
            'should stay modalAccountKey stable and modalCryptoId stable',
            'mocked-key' as AccountKey,
            tradingMiddlewareFixtures.TRADING_SELL_ROUTE,
        ],
        [
            'should clean modalAccountKey and modalCryptoId when trading is abandoned',
            undefined,
            {
                ...tradingMiddlewareFixtures.DEFAULT_ROUTE,
                pathname: '/start',
                app: 'start',
                route: getRequiredRoute('suite-start'),
            },
        ],
    ])('%s', (_, result, routeChange) => {
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    modalAccountKey: 'mocked-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                    modalCryptoId: 'mocked-key' as CryptoId,
                },
                router: routerReducer(tradingMiddlewareFixtures.TRADING_SELL_ROUTE, {
                    type: 'init',
                } as UnknownAction),
            }),
        );

        // go away from trading
        store.dispatch(routerLocationChange({ ...routeChange }));

        expect(store.getState().wallet.trading.modalCryptoId).toEqual(result);
        expect(store.getState().wallet.trading.modalAccountKey).toEqual(result);
    });

    it.each<
        [
            string,
            { cryptoId: CryptoId | undefined; key: AccountKey | undefined },
            RouterState,
            LocationChangePayload,
        ]
    >([
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
                router: routerReducer(routeDefault, { type: 'init' } as UnknownAction),
            }),
        );

        store.dispatch(routerLocationChange({ ...routeChange }));

        expect(store.getState().wallet.trading.prefilledFromAccount).toEqual(result);
    });

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

        expect(invityAPI.createInvityAPIKey).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading[section].tradingAccountKey).toEqual(
            'btc-descriptor',
        );
    });
});
