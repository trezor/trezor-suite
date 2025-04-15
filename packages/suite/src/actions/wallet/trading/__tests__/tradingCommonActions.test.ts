import { DeviceReducerState } from '@suite-common/wallet-core';
import type { DeepPartial } from '@trezor/type-utils';

import { DEFAULT_STORE } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/store';
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
