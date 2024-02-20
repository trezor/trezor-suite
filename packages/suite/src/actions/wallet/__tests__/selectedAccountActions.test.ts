import { configureStore } from 'src/support/tests/configureStore';

import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';

import { syncSelectedAccount } from '../selectedAccountActions';
import fixtures from '../__fixtures__/selectedAccountActions';

export const getInitialState = (_settings?: any) => ({
    wallet: {
        selectedAccount: {
            ...selectedAccountReducer(undefined, { type: 'foo' } as any),
        },
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { selectedAccount } = store.getState().wallet;
        store.getState().wallet.selectedAccount = selectedAccountReducer(selectedAccount, action);
        store.getActions().push(action);
    });

    return store;
};

describe('selectedAccount Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const state = getInitialState(f.initialState);
            const store = initStore(state);
            const selectedAccountState = store.dispatch(syncSelectedAccount(f.action as any));
            if (f.result) {
                expect(selectedAccountState).toMatchObject(f.result as any);
            } else {
                expect(selectedAccountState).toBe(undefined);
            }
        });
    });
});
