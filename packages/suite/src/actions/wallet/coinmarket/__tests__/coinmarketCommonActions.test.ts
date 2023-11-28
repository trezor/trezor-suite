import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer, { ComposedTransactionInfo } from 'src/reducers/wallet/coinmarketReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import * as coinmarketCommonActions from '../coinmarketCommonActions';
import { DEFAULT_STORE } from '../__fixtures__/coinmarketCommonActions/store';
import {
    VERIFY_BUY_ADDRESS_FIXTURES,
    VERIFY_EXCHANGE_ADDRESS_FIXTURES,
} from '../__fixtures__/coinmarketCommonActions/verifyAddress';
import { transactionsReducer } from 'src/reducers/wallet';

export const getInitialState = (initial = {}) => ({
    ...DEFAULT_STORE,
    ...initial,
});
type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket, selectedAccount, transactions } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
            selectedAccount: selectedAccountReducer({ ...selectedAccount }, action),
            transactions: transactionsReducer(transactions, action),
        };
        store.getActions().push(action);
    });
    return store;
};

describe('Coinmarket Common Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    VERIFY_BUY_ADDRESS_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(
                coinmarketCommonActions.verifyAddress(
                    f.params.account,
                    f.params.address,
                    f.params.path,
                    f.params.coinmarketAction,
                ),
            );
            expect(store.getState().wallet.coinmarket.buy.addressVerified).toEqual(f.result.value);
            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });

    VERIFY_EXCHANGE_ADDRESS_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(
                coinmarketCommonActions.verifyAddress(
                    f.params.account,
                    f.params.address,
                    f.params.path,
                    f.params.coinmarketAction,
                ),
            );
            expect(store.getState().wallet.coinmarket.exchange.addressVerified).toEqual(
                f.result.value,
            );
            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });

    it('saveComposedTransaction', () => {
        const store = initStore(getInitialState());

        const info: ComposedTransactionInfo = {
            selectedFee: 'normal',
            composed: {
                fee: '43214234',
                feePerByte: '13',
            },
        };

        store.dispatch(coinmarketCommonActions.saveComposedTransactionInfo(info));
        expect(store.getState().wallet.coinmarket.composedTransactionInfo).toEqual(info);
    });
});
