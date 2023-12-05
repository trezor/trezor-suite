import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer, { ComposedTransactionInfo } from 'src/reducers/wallet/coinmarketReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import * as coinmarketCommonActions from '../coinmarketCommonActions';
import { DEFAULT_STORE } from '../__fixtures__/coinmarketCommonActions/store';
import {
    VERIFY_BUY_ADDRESS_FIXTURES,
    VERIFY_EXCHANGE_ADDRESS_FIXTURES,
} from '../__fixtures__/coinmarketCommonActions/verifyAddress';
import { transactionsReducer, accountsReducer } from 'src/reducers/wallet';
import { State as DeviceState } from '@suite-common/wallet-core';
import { SuiteState } from 'src/reducers/suite/suiteReducer';
import type { DeepPartial } from '@trezor/type-utils';

interface InitialState {
    device?: DeepPartial<DeviceState>;
    suite?: DeepPartial<SuiteState>;
    wallet?: {
        accounts?: ReturnType<typeof accountsReducer>;
        transactions?: ReturnType<typeof transactionsReducer>;
        selectedAccount?: ReturnType<typeof selectedAccountReducer>;
        coinmarket?: ReturnType<typeof coinmarketReducer>;
    };
}

export const getInitialState = (initial: InitialState) => ({
    ...DEFAULT_STORE,
    ...initial,
    wallet: {
        ...DEFAULT_STORE.wallet,
        ...initial.wallet,
    },
});
type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket, selectedAccount, transactions, accounts } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
            selectedAccount: selectedAccountReducer({ ...selectedAccount }, action),
            transactions: transactionsReducer(transactions, action),
            accounts: accountsReducer(accounts, action),
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
            if (f.result && f.result.action) {
                expect(store.getActions().pop()).toMatchObject(f.result.action);
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
            if (f.result && f.result.action) {
                expect(store.getActions().pop()).toMatchObject(f.result.action);
            }
        });
    });

    it('saveComposedTransaction', () => {
        const store = initStore(getInitialState({ wallet: { accounts: [] } }));

        const info: ComposedTransactionInfo = {
            selectedFee: 'normal',
            composed: {
                fee: '43214234',
                feeLimit: '123',
                feePerByte: '13',
                estimatedFeeLimit: '123',
                token: {
                    type: 'abc',
                    contract: 'cde',
                    decimals: 0,
                },
            },
        };

        store.dispatch(coinmarketCommonActions.saveComposedTransactionInfo(info));
        expect(store.getState().wallet.coinmarket.composedTransactionInfo).toEqual(info);
    });
});
