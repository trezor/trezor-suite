import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import coinmarketSavingsMiddleware from '@wallet-middlewares/coinmarketSavingsMiddleware';
import { Action } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import invityAPI, { SavingsTradeResponse } from '@suite-services/invityAPI';
import suiteReducer from '@suite-reducers/suiteReducer';
import { SAVINGS_TRADE_RESPONSE } from '../__fixtures__/coinmarketSavingsMiddleware';

jest.mock('@suite-services/invityAPI');
invityAPI.createInvityAPIKey = () => {};
invityAPI.getSavingsTrade = (): Promise<SavingsTradeResponse | undefined> =>
    Promise.resolve(SAVINGS_TRADE_RESPONSE);

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

    it('loadSavingsTrade', () => {
        // @ts-ignore
        const store = initStore(
            getInitialState({
                coinmarket: initialState,
            }),
        );

        store.dispatch({ type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE });
        expect(store.getActions()).toEqual([
            { type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE },
        ]);
    });
});
