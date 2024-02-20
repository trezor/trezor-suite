import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer from 'src/reducers/wallet/coinmarketReducer';

import * as coinmarketSpendActions from '../coinmarketSpendActions';
import { SellVoucherTrade as SpendTrade } from 'invity-api';
import { BTC_ACCOUNT } from '../coinmarket/__fixtures__/coinmarketCommonActions/accounts';

export const getInitialState = () => ({
    wallet: {
        coinmarket: coinmarketReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('Coinmarket Spend Actions', () => {
    it('saveTrade', () => {
        const store = initStore(getInitialState());

        const trade: SpendTrade = {
            paymentId: 'FAKE-PAYMENT-ID',
            cryptoAmount: 0.12345678,
            cryptoCurrency: 'BTC',
            destinationAddress: 'FAKE-DESTINATION-ADDRESS',
        };

        store.dispatch(
            coinmarketSpendActions.saveTrade(trade, BTC_ACCOUNT, new Date().toISOString()),
        );
        expect(store.getState().wallet.coinmarket.trades[0].tradeType).toEqual('spend');
        expect(
            (store.getState().wallet.coinmarket.trades[0].data as SpendTrade).cryptoAmount,
        ).toEqual(0.12345678);
    });
});
