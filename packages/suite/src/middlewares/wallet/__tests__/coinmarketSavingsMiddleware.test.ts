import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import coinmarketSavingsMiddleware from '@wallet-middlewares/coinmarketSavingsMiddleware';
import { Action } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import { ROUTER } from '@suite-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import routerReducer from '@suite-reducers/routerReducer';
import { InvityAuthentication } from '@wallet-types/invity';

jest.mock('@suite-services/invityAPI');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};

const ACCOUNT = {
    descriptor: 'btc-descriptor',
    symbol: 'btc',
    index: 0,
    accountType: 'normal',
};

const INVITY_AUTHENTICATION: InvityAuthentication = {
    accountInfo: {
        settings: {
            country: 'CZ',
            language: 'CZ',
            cryptoCurrency: 'BTC',
            fiatCurrency: 'EUR',
        },
        id: 'FakeId',
        buyTrades: [],
        exchangeTrades: [],
        sellTrades: [],
        sessions: [],
    },
};

type CoinmarketState = ReturnType<typeof coinmarketReducer>;
type SelectedAccountState = ReturnType<typeof selectedAccountReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;
interface Args {
    coinmarket?: CoinmarketState;
    selectedAccount?: SelectedAccountState;
    settings?: SuiteState['settings'];
}

export const getInitialState = ({ coinmarket, selectedAccount }: Args = {}) => ({
    wallet: {
        coinmarket:
            coinmarket ||
            coinmarketReducer(
                {
                    invityAuthentication: undefined,
                    isSavingsTradeLoading: false,
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
                    invityServerEnvironment: 'development',
                },
            },
            locks: [],
        } as any,
        { type: 'foo' } as any,
    ),
    modal: modalReducer(undefined, { type: 'foo' } as any),
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([thunk, coinmarketSavingsMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket, selectedAccount } = store.getState().wallet;
        const { settings } = store.getState().suite;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
            selectedAccount: selectedAccountReducer(selectedAccount, action),
        };
        store.getState().suite = suiteReducer(
            {
                settings,
            } as any,
            action,
        );

        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('coinmarketSavingsMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('load savings trade - redirect to savings index page', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    app: 'wallet',
                    hash: '/btc/0',
                    params: {
                        accountIndex: 0,
                        accountType: 'normal',
                        symbol: 'btc',
                    },
                    pathname: '/accounts/coinmarket/savings',
                    route: {
                        app: 'wallet',
                        exact: true,
                        name: 'wallet-coinmarket-savings',
                        params: ['symbol', 'accountIndex', 'accountType'],
                        pattern: '/accounts/coinmarket/savings',
                    },
                    url: '/accounts/coinmarket/savings#/btc/0',
                },
                type: ROUTER.LOCATION_CHANGE,
            },
            { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
        ]);
    });

    it('load savings trade - redirect to user info page', () => {
        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    invityAuthentication: INVITY_AUTHENTICATION,
                },
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    app: 'wallet',
                    hash: '/btc/0',
                    params: {
                        accountIndex: 0,
                        accountType: 'normal',
                        symbol: 'btc',
                    },
                    pathname: '/accounts/invity/user-info',
                    route: {
                        app: 'wallet',
                        name: 'wallet-invity-user-info',
                        params: ['symbol', 'accountIndex', 'accountType'],
                        pattern: '/accounts/invity/user-info',
                    },
                    url: '/accounts/invity/user-info#/btc/0',
                },
                type: ROUTER.LOCATION_CHANGE,
            },
            { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
        ]);
    });

    it('load savings trade - redirect to user info page', () => {
        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    invityAuthentication: {
                        ...INVITY_AUTHENTICATION,
                        accountInfo: {
                            ...INVITY_AUTHENTICATION.accountInfo!,
                            settings: {
                                ...INVITY_AUTHENTICATION.accountInfo!.settings,
                                givenName: 'FAKE',
                                familyName: 'FAKE',
                                phoneNumber: 'FAKE',
                            },
                        },
                    },
                },
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    app: 'wallet',
                    hash: '/btc/0',
                    params: {
                        accountIndex: 0,
                        accountType: 'normal',
                        symbol: 'btc',
                    },
                    pathname: '/accounts/invity/phone-number-verification',
                    route: {
                        app: 'wallet',
                        name: 'wallet-invity-phone-number-verification',
                        params: ['symbol', 'accountIndex', 'accountType'],
                        pattern: '/accounts/invity/phone-number-verification',
                    },
                    url: '/accounts/invity/phone-number-verification#/btc/0',
                },
                type: ROUTER.LOCATION_CHANGE,
            },
            { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
        ]);
    });

    // TODO: Cover whole middleware - based on
});
