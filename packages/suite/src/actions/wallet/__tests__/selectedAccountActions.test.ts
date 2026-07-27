import { selectedAccountReducer } from '@suite/account';

import { configureStore } from 'src/support/tests/configureStore';

import fixtures from '../__fixtures__/selectedAccountActions';
import { syncSelectedAccount } from '../selectedAccountActions';

const getInitialState = (initialState: any = {}) => ({
    suite: {},
    device: {
        selectedDevice: undefined,
        ...initialState.device,
    },
    router: {
        app: 'wallet',
        route: { name: 'wallet-index' },
        params: undefined,
        ...initialState.router,
    },
    wallet: {
        accounts: [],
        settings: { enabledNetworks: [] },
        discovery: {},
        accountSearch: { coinFilter: [] },
        ...initialState.wallet,
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
            store.dispatch(syncSelectedAccount(f.action as any));
            expect(store.getState().wallet.selectedAccount).toMatchObject(f.result as any);
        });
    });
});
