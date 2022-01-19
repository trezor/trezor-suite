import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import coinmarketMiddleware from '@wallet-middlewares/coinmarketMiddleware';
import { Action } from '@suite-types';
import { COINMARKET_COMMON } from '@wallet-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import suiteReducer from '@suite-reducers/suiteReducer';

jest.mock('@suite-services/invityAPI');
invityAPI.setInvityServersEnvironment = () => {};
invityAPI.createInvityAPIKey = () => {};

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
                    invityServerEnvironment: 'development',
                },
            },
        } as any,
        { type: 'foo' } as any,
    ),
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([thunk, coinmarketMiddleware]);

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

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_COMMON.SET_LOADING, isLoading: true },
            { type: COINMARKET_COMMON.LOAD_DATA },
        ]);
        expect(getCurrentAccountDescriptorMock).toBeCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(1);
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

        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: { ...initialState, lastLoadedTimestamp: 0 },
            }),
        );

        store.dispatch({ type: COINMARKET_COMMON.LOAD_DATA });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_COMMON.SET_LOADING, isLoading: true },
            { type: COINMARKET_COMMON.LOAD_DATA },
        ]);
        expect(getCurrentAccountDescriptorMock).toBeCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(1);
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

        // @ts-ignore
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
        expect(getCurrentAccountDescriptorMock).toBeCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toBeCalledTimes(0);
    });
});
