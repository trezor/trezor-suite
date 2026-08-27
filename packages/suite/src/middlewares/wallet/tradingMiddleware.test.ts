import { type CryptoId } from 'invity-api';
import { combineReducers } from 'redux';

import { selectedAccountReducer } from '@suite/account';
import { MODAL_CONTEXT_NONE, type State as ModalState, modalReducer } from '@suite/modal';
import {
    type LocationChangePayload,
    type RouterState,
    getRoute,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import {
    type TradingState,
    initialState,
    prepareTradingReducer,
    tradeApi,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import { type AccountKey, type SelectedAccountStatus } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

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
                tradeServerEnvironment: 'dev',
            },
        },
    },
    router: router ?? routerReducer(tradingMiddlewareFixtures.DEFAULT_ROUTE, { type: 'init' }),
    modal: modalReducer({ context: MODAL_CONTEXT_NONE }, { type: 'init' }),
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const { settings } = state.suite;
    const { trading, selectedAccount } = state.wallet;

    const store = configureMockStore({
        extra: undefined,
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
});
