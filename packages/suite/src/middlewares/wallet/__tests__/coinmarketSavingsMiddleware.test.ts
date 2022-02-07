import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import coinmarketSavingsMiddleware from '@wallet-middlewares/coinmarketSavingsMiddleware';
import { Action } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import { ROUTER } from '@suite-actions/constants';
import invityAPI, { SavingsTradeResponse } from '@suite-services/invityAPI';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import routerReducer from '@suite-reducers/routerReducer';
import {
    ACCOUNT,
    INVITY_AUTHENTICATION,
    SELECTED_PROVIDER,
} from '../__fixtures__/coinmarketSavingsMiddleware';

jest.mock('@suite-services/invityAPI');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};

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
                    savings: {
                        selectedProvider: SELECTED_PROVIDER,
                    },
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
        formDrafts: {},
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
        const { settings, locks } = store.getState().suite;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
            selectedAccount: selectedAccountReducer(selectedAccount, action),
            formDrafts: {},
        };
        store.getState().suite = suiteReducer(
            {
                settings,
                locks,
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
    it('load savings trade - redirect to savings after country set', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.SET_USER_COUNTRY_EFFECTIVE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    anchor: undefined,
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
            { type: COINMARKET_SAVINGS.SET_USER_COUNTRY_EFFECTIVE },
        ]);
    });

    it('load savings trade - redirect to savings unsupported country', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    savings: {
                        ...initialState.savings,
                        countryEffective: undefined,
                        selectedProvider: {
                            ...SELECTED_PROVIDER,
                            isClientFromUnsupportedCountry: true,
                        },
                    },
                },
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    anchor: undefined,
                    app: 'wallet',
                    hash: '/btc/0',
                    params: {
                        accountIndex: 0,
                        accountType: 'normal',
                        symbol: 'btc',
                    },
                    pathname: '/accounts/coinmarket/savings/unsupported-country',
                    route: {
                        app: 'wallet',
                        exact: true,
                        name: 'wallet-coinmarket-savings-unsupported-country',
                        params: ['symbol', 'accountIndex', 'accountType'],
                        pattern: '/accounts/coinmarket/savings/unsupported-country',
                    },
                    url: '/accounts/coinmarket/savings/unsupported-country#/btc/0',
                },
                type: ROUTER.LOCATION_CHANGE,
            },
            { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
        ]);
    });

    it('load savings trade - redirect to savings for anonymous user', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    savings: {
                        ...initialState.savings,
                        selectedProvider: SELECTED_PROVIDER,
                    },
                    invityAuthentication: undefined,
                },
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            {
                payload: {
                    anchor: undefined,
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
                    savings: {
                        ...initialState.savings,
                        selectedProvider: SELECTED_PROVIDER,
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

    it('load savings trade - redirect to phone number verification', () => {
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
                    savings: {
                        ...initialState.savings,
                        selectedProvider: SELECTED_PROVIDER,
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

    it('load savings trade - get savings trade', () => {
        const savingsTradeResponses: SavingsTradeResponse[] = [
            {
                trade: {
                    exchange: 'FAKE',
                    kycStatus: 'InProgress',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    kycStatus: 'Open',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    kycStatus: 'Failed',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    amlStatus: 'Open',
                    status: 'AML',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    status: 'SetSavingsParameters',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    status: 'ConfirmPaymentInfo',
                },
            },
            {
                trade: {
                    exchange: 'FAKE',
                    errors: ['FAKE_ERROR'],
                },
            },
        ];
        savingsTradeResponses.forEach(savingsTradeResponse => {
            invityAPI.getSavingsTrade = (_: string) => Promise.resolve(savingsTradeResponse);
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
                                    phoneNumberVerified: 'FAKE',
                                },
                            },
                        },
                        savings: {
                            ...initialState.savings,
                            selectedProvider: SELECTED_PROVIDER,
                        },
                    },
                }),
            );

            store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
            expect(store.getActions()).toEqual([
                {
                    isSavingsTradeLoading: true,
                    type: COINMARKET_SAVINGS.SET_SAVINGS_TRADE_RESPONSE_LOADING,
                },
                { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
            ]);
        });
    });

    it('load savings trade - start watching kyc', () => {
        jest.spyOn(window, 'setTimeout');
        jest.spyOn(window, 'setInterval');
        jest.useFakeTimers();
        jest.runAllTimers();
        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS },
        ]);
    });

    it('load savings trade - stop watching kyc', () => {
        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: {
                    ...initialState,
                    savings: {
                        ...initialState.savings,
                        watchingKYCMetadata: {
                            intervalId: 1,
                            timeoutId: 1,
                        },
                    },
                },
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS });
        expect(store.getActions()).toEqual([{ type: COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS }]);
    });
    // TODO: Cover whole middleware - based on
});
