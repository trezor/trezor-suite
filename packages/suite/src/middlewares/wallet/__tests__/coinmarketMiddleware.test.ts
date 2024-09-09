import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer, { initialState } from 'src/reducers/wallet/coinmarketReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import coinmarketMiddleware from 'src/middlewares/wallet/coinmarketMiddleware';
import { Action } from 'src/types/suite';
import { COINMARKET_COMMON } from 'src/actions/wallet/constants';
import invityAPI from 'src/services/suite/invityAPI';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { accounts } from 'src/reducers/wallet/__fixtures__/transactionConstants';
import routerReducer, { RouterState } from 'src/reducers/suite/routerReducer';
import modalReducer, { State as ModalState } from 'src/reducers/suite/modalReducer';
import { MODAL, ROUTER } from 'src/actions/suite/constants';
import { UI } from '@trezor/connect';

jest.mock('src/services/suite/invityAPI');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};
invityAPI.getInfo = () =>
    Promise.resolve({
        coins: {},
        platforms: {},
    });

export const ACCOUNT = {
    descriptor: 'btc-descriptor',
};

const COINMARKET_EXCHANGE_ROUTE = {
    anchor: undefined,
    app: 'wallet',
    hash: '/btc/0/normal',
    loaded: true,
    params: { symbol: 'btc', accountIndex: 0, accountType: 'normal' },
    pathname: '/accounts/coinmarket/exchange',
    route: {
        name: 'wallet-coinmarket-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
    },
    settingsBackRoute: { name: 'wallet-index', params: undefined },
    url: '/accounts/coinmarket/exchange#/btc/0/normal',
};

type CoinmarketState = ReturnType<typeof coinmarketReducer>;
type SelectedAccountState = ReturnType<typeof selectedAccountReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;
interface Args {
    coinmarket?: CoinmarketState;
    selectedAccount?: SelectedAccountState;
    settings?: SuiteState['settings'];
    router?: RouterState;
    modal?: ModalState;
}

export const getInitialState = ({ coinmarket, selectedAccount }: Args = {}) => ({
    wallet: {
        coinmarket:
            coinmarket ||
            coinmarketReducer(
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
    router: routerReducer(
        {
            loaded: false,
            url: '/',
            pathname: '/',
            app: 'unknown',
            route: undefined,
            params: undefined,
            settingsBackRoute: {
                name: 'suite-index',
            },
        } as RouterState,
        {} as Action,
    ),
    modal: modalReducer({ context: MODAL.CONTEXT_NONE }, {} as Action),
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([coinmarketMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const state = store.getState();
        const { coinmarket, selectedAccount } = state.wallet;
        const { settings } = state.suite;
        state.wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
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

describe('coinmarketMiddleware', () => {
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
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_COMMON.SET_LOADING, isLoading: true, lastLoadedTimestamp: 0 },
            { type: COINMARKET_COMMON.LOAD_DATA },
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
                coinmarket: { ...initialState, lastLoadedTimestamp: 0 },
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_COMMON.SET_LOADING, isLoading: true, lastLoadedTimestamp: 0 },
            { type: COINMARKET_COMMON.LOAD_DATA },
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
                coinmarket: {
                    ...initialState,
                    lastLoadedTimestamp: Date.now(),
                },
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([{ type: COINMARKET_COMMON.LOAD_DATA }]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(0);
    });

    it('Test of cleaning modalAccount property after receive modal is closed', () => {
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    modalAccount: accounts[0],
                    lastLoadedTimestamp: Date.now(),
                },
            }),
        );

        // go to coinmarket
        store.dispatch({
            type: ROUTER.LOCATION_CHANGE,
            payload: COINMARKET_EXCHANGE_ROUTE,
        });

        // open modal
        store.dispatch({
            type: UI.REQUEST_BUTTON,
            payload: {
                context: MODAL.CONTEXT_DEVICE,
                code: 'ButtonRequest_Address',
            },
        });

        // close modal
        store.dispatch({
            type: UI.CLOSE_UI_WINDOW,
        });

        expect(store.getState().wallet.coinmarket.modalAccount).toEqual(undefined);
    });

    it('Test of cleaning modalAccount property after send modal is closed', () => {
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    modalAccount: accounts[0],
                    lastLoadedTimestamp: Date.now(),
                },
            }),
        );

        // go to coinmarket
        store.dispatch({
            type: ROUTER.LOCATION_CHANGE,
            payload: COINMARKET_EXCHANGE_ROUTE,
        });

        // open modal
        store.dispatch({
            type: UI.REQUEST_BUTTON,
            payload: {
                context: MODAL.CONTEXT_DEVICE,
                code: 'ButtonRequest_SignTx',
            },
        });

        // close modal
        store.dispatch({
            type: MODAL.CLOSE,
        });

        expect(store.getState().wallet.coinmarket.modalAccount).toEqual(undefined);
    });

    it('Test of cleaning coinmarketAccount property', () => {
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    exchange: {
                        ...initialState.exchange,
                        coinmarketAccount: accounts[0],
                    },
                    sell: {
                        ...initialState.sell,
                        coinmarketAccount: accounts[0],
                    },
                },
            }),
        );

        // go to coinmarket
        store.dispatch({
            type: ROUTER.LOCATION_CHANGE,
            payload: COINMARKET_EXCHANGE_ROUTE,
        });

        expect(store.getState().wallet.coinmarket.sell.coinmarketAccount).toBe(accounts[0]);
        expect(store.getState().wallet.coinmarket.exchange.coinmarketAccount).toEqual(undefined);
    });
});
