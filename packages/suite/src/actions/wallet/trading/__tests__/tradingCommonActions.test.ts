import { DeviceReducerState } from '@suite-common/wallet-core';
import type { DeepPartial } from '@trezor/type-utils';

import { DEFAULT_STORE } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/store';
import {
    VERIFY_BUY_ADDRESS_FIXTURES,
    VERIFY_EXCHANGE_ADDRESS_FIXTURES,
} from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/verifyAddress';
import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import { SuiteState } from 'src/reducers/suite/suiteReducer';
import { accountsReducer, transactionsReducer } from 'src/reducers/wallet';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { ComposedTransactionInfo, tradingReducer } from 'src/reducers/wallet/tradingReducer';
import { configureStore } from 'src/support/tests/configureStore';

interface InitialState {
    device?: DeepPartial<DeviceReducerState>;
    suite?: DeepPartial<SuiteState>;
    wallet?: {
        accounts?: ReturnType<typeof accountsReducer>;
        transactions?: ReturnType<typeof transactionsReducer>;
        selectedAccount?: ReturnType<typeof selectedAccountReducer>;
        trading?: ReturnType<typeof tradingReducer>;
    };
}

const getInitialState = (initial: InitialState) => ({
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
        const { trading, selectedAccount, transactions, accounts } = store.getState().wallet;
        store.getState().wallet = {
            trading: tradingReducer(trading, action),
            selectedAccount: selectedAccountReducer({ ...selectedAccount }, action),
            transactions: transactionsReducer(transactions, action),
            accounts: accountsReducer(accounts, action),
        };
        store.getActions().push(action);
    });

    return store;
};

describe('Trading Common Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    VERIFY_BUY_ADDRESS_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(
                tradingCommonActions.verifyAddress(
                    f.params.account,
                    f.params.address,
                    f.params.path,
                    f.params.tradingAction,
                ),
            );
            expect(store.getState().wallet.trading.buy.addressVerified).toEqual(f.result.value);
            if (f.result && f.result.action) {
                expect(store.getActions().pop()).toMatchObject(f.result.action);
            }
        });
    });

    VERIFY_EXCHANGE_ADDRESS_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(
                tradingCommonActions.verifyAddress(
                    f.params.account,
                    f.params.address,
                    f.params.path,
                    f.params.tradingAction,
                ),
            );
            expect(store.getState().wallet.trading.exchange.addressVerified).toEqual(
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
                    standard: 'ERC20',
                    contract: 'cde',
                    decimals: 0,
                },
            },
        };

        store.dispatch(tradingCommonActions.saveComposedTransactionInfo(info));
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(info);
    });
});
