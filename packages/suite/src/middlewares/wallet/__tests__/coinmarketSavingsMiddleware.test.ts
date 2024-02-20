import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer, { initialState } from 'src/reducers/wallet/coinmarketReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import coinmarketSavingsMiddleware from 'src/middlewares/wallet/coinmarketSavingsMiddleware';
import { Action } from 'src/types/suite';
import { COINMARKET_SAVINGS } from 'src/actions/wallet/constants';
import { SavingsTradeResponse } from 'invity-api';
import invityAPI from 'src/services/suite/invityAPI';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { SAVINGS_TRADE_RESPONSE } from '../__fixtures__/coinmarketSavingsMiddleware';

jest.mock('src/services/suite/invityAPI');
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
                    invityServerEnvironment: 'dev',
                },
            },
        } as any,
        { type: 'foo' } as any,
    ),
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([coinmarketSavingsMiddleware]);

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
