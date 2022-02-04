import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import invityAuthenticationMiddleware from '@wallet-middlewares/invityAuthenticationMiddleware';
import type { Action } from '@suite-types';
import { COINMARKET_COMMON } from '@wallet-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import suiteReducer from '@suite-reducers/suiteReducer';
import {
    ACCOUNT_INFO_RESOPONSE,
    INVITY_AUTHENTICATION,
} from '../__fixtures__/invityAuthenticationMiddleware';

jest.mock('@suite-services/invityAPI');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};
invityAPI.setProtectedAPI = () => {};

export const ACCOUNT = {
    descriptor: 'btc-descriptor',
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
                    isInvityAuthenticationLoading: false,
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
        } as any,
        { type: 'foo' } as any,
    ),
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([thunk, invityAuthenticationMiddleware]);

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

describe('invityAuthenticationMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('load Invity authentication - success', () => {
        invityAPI.getInvityAuthentication = () => Promise.resolve(INVITY_AUTHENTICATION);
        invityAPI.getAccountInfo = () => Promise.resolve(ACCOUNT_INFO_RESOPONSE);
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const getInvityAuthenticationMock = jest.spyOn(invityAPI, 'getInvityAuthentication');

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION });
        expect(store.getActions()).toEqual([
            {
                type: COINMARKET_COMMON.SET_INVITY_AUTHENTICATION_LOADING,
                isInvityAuthenticationLoading: true,
            },
            {
                type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION,
            },
        ]);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(1);
        expect(getInvityAuthenticationMock).toBeCalledTimes(1);
    });

    it('load Invity authentication - authentication server returned error authentication', () => {
        invityAPI.getInvityAuthentication = () =>
            Promise.resolve({
                ...INVITY_AUTHENTICATION,
                error: {
                    code: 0,
                    reason: 'FAKE',
                    status: 'FAKE',
                },
            });
        invityAPI.getAccountInfo = () => Promise.resolve(ACCOUNT_INFO_RESOPONSE);
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const getInvityAuthenticationMock = jest.spyOn(invityAPI, 'getInvityAuthentication');

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION });
        expect(store.getActions()).toEqual([
            {
                type: COINMARKET_COMMON.SET_INVITY_AUTHENTICATION_LOADING,
                isInvityAuthenticationLoading: true,
            },
            {
                type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION,
            },
        ]);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(1);
        expect(getInvityAuthenticationMock).toBeCalledTimes(1);
    });

    it('load Invity authentication - Invity API server returned error', () => {
        invityAPI.getInvityAuthentication = () => Promise.resolve(INVITY_AUTHENTICATION);
        invityAPI.getAccountInfo = () =>
            Promise.resolve({
                ...ACCOUNT_INFO_RESOPONSE,
                data: undefined,
                error: 'FAKE_ERROR',
            });
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

        const getInvityAuthenticationMock = jest.spyOn(invityAPI, 'getInvityAuthentication');

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION });
        expect(store.getActions()).toEqual([
            {
                type: COINMARKET_COMMON.SET_INVITY_AUTHENTICATION_LOADING,
                isInvityAuthenticationLoading: true,
            },
            {
                type: COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION,
            },
        ]);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(1);
        expect(getInvityAuthenticationMock).toBeCalledTimes(1);
    });
});
