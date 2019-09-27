import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import accountsReducer from '@wallet-reducers/accountsReducer';
import * as blockchainActions from '../blockchainActions';

type AccountsState = ReturnType<typeof accountsReducer>;
interface InitialState {
    accounts?: AccountsState;
}

export const getInitialState = (state: InitialState | undefined) => {
    const accounts = state ? state.accounts : [];
    return {
        wallet: {
            accounts: accountsReducer(accounts, { type: 'foo' } as any),
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { accounts } = store.getState().wallet;
        store.getState().wallet.accounts = accountsReducer(accounts, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Blockchain Actions', () => {
    it('init', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(blockchainActions.init());
        expect(store.getActions().length).toEqual(1);
    });
});
