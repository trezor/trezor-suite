import { invityAPI } from '@suite-common/trading';

import { MODAL, ROUTER } from 'src/actions/suite/constants';
import { TRADING_COMMON } from 'src/actions/wallet/constants';
import { tradingMiddleware } from 'src/middlewares/wallet/tradingMiddleware';
import modalReducer, { State as ModalState } from 'src/reducers/suite/modalReducer';
import routerReducer, { RouterState } from 'src/reducers/suite/routerReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { accounts } from 'src/reducers/wallet/__fixtures__/transactionConstants';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { initialState, tradingReducer } from 'src/reducers/wallet/tradingReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { Action } from 'src/types/suite';

jest.mock('@suite-common/trading');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};
invityAPI.getInfo = () =>
    Promise.resolve({
        coins: {},
        platforms: {},
    });

const ACCOUNT = {
    descriptor: 'btc-descriptor',
};

const TRADING_EXCHANGE_ROUTE = {
    anchor: undefined,
    app: 'wallet',
    hash: '/btc/0/normal',
    loaded: true,
    params: { symbol: 'btc', accountIndex: 0, accountType: 'normal' },
    pathname: '/accounts/coinmarket/exchange',
    route: {
        name: 'wallet-trading-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
    },
    settingsBackRoute: { name: 'wallet-index', params: undefined },
    url: '/accounts/coinmarket/exchange#/btc/0/normal',
};

const DEFAULT_ROUTE = {
    loaded: false,
    url: '/',
    pathname: '/',
    app: 'unknown',
    route: undefined,
    params: undefined,
    settingsBackRoute: {
        name: 'suite-index',
    },
} as RouterState;

type TradingState = ReturnType<typeof tradingReducer>;
type SelectedAccountState = ReturnType<typeof selectedAccountReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

interface Args {
    trading?: TradingState;
    selectedAccount?: SelectedAccountState;
    settings?: SuiteState['settings'];
    router?: RouterState;
    modal?: ModalState;
}

const getInitialState = ({ trading, selectedAccount, router }: Args = {}) => ({
    wallet: {
        trading:
            trading ||
            tradingReducer(
                {
                    isLoading: false,
                    lastLoadedTimestamp: 0,
                } as any,
                { type: 'foo' } as any,
            ),
        selectedAccount:
            selectedAccount ||
            selectedAccountReducer(
                {
                    status: 'loaded',
                    account: ACCOUNT,
                } as any,
                { type: 'foo' } as any,
            ),
    },
    suite: suiteReducer(
        {
            settings: {
                debug: {
                    invityServerEnvironment: 'dev',
                },
            },
        } as any,
        { type: 'foo' } as any,
    ),
    router: router ?? routerReducer(DEFAULT_ROUTE, {} as Action),
    modal: modalReducer({ context: MODAL.CONTEXT_NONE }, {} as Action),
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([tradingMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const state = store.getState();
        const { trading, selectedAccount } = state.wallet;
        const { settings } = state.suite;
        state.wallet = {
            trading: tradingReducer(trading, action),
            selectedAccount: selectedAccountReducer(selectedAccount, action),
        };
        state.suite = suiteReducer(
            {
                settings,
            } as any,
            action,
        );
        state.router = routerReducer(
            {
                ...state.router,
            } as any,
            action,
        );
        state.modal = modalReducer(
            {
                ...state.modal,
            } as any,
            action,
        );

        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('tradingMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('loadData - account changed', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        const getCurrentAccountDescriptorMock = jest.spyOn(
            invityAPI,
            'getCurrentAccountDescriptor',
        );
        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const store = initStore(
            getInitialState({
                trading: initialState,
            }),
        );

        store.dispatch({ type: TRADING_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: TRADING_COMMON.SET_LOADING, isLoading: true, lastLoadedTimestamp: 0 },
            { type: TRADING_COMMON.LOAD_DATA },
        ]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(1);
    });

    it('loadData - outdated data', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'btc-descriptor';

        const getCurrentAccountDescriptorMock = jest.spyOn(
            invityAPI,
            'getCurrentAccountDescriptor',
        );
        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const store = initStore(
            getInitialState({
                trading: { ...initialState, lastLoadedTimestamp: 0 },
            }),
        );

        store.dispatch({ type: TRADING_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: TRADING_COMMON.SET_LOADING, isLoading: true, lastLoadedTimestamp: 0 },
            { type: TRADING_COMMON.LOAD_DATA },
        ]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(1);
    });

    it('loadData - keep current data', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'btc-descriptor';

        const getCurrentAccountDescriptorMock = jest.spyOn(
            invityAPI,
            'getCurrentAccountDescriptor',
        );
        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    lastLoadedTimestamp: Date.now(),
                },
            }),
        );

        store.dispatch({ type: TRADING_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([{ type: TRADING_COMMON.LOAD_DATA }]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(0);
    });

    it('should clean modalAccountKey after leaving trading', () => {
        const store = initStore(
            getInitialState({
                trading: {
                    ...initialState,
                    modalAccountKey: accounts[0].key,
                    lastLoadedTimestamp: Date.now(),
                },
                router: routerReducer(TRADING_EXCHANGE_ROUTE as RouterState, {} as Action),
            }),
        );

        // go away from trading
        store.dispatch({
            type: ROUTER.LOCATION_CHANGE,
            payload: {
                ...DEFAULT_ROUTE,
                route: {
                    ...DEFAULT_ROUTE.route,
                    name: 'suite-start',
                },
            },
        });

        expect(store.getState().wallet.trading.modalAccountKey).toEqual(undefined);
    });

    it('Test of setting activeSection after changing route', () => {
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
            type: ROUTER.LOCATION_CHANGE,
            payload: {
                ...TRADING_EXCHANGE_ROUTE,
            },
        });

        expect(store.getState().wallet.trading.activeSection).toBe('exchange');
    });
});
