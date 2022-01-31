import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import invityAuthenticationMiddleware from '@wallet-middlewares/invityAuthenticationMiddleware';
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

    it('load Invity authentication', () => {
        invityAPI.getCurrentAccountDescriptor = () => 'FakeDescriptor';

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
    });
});
