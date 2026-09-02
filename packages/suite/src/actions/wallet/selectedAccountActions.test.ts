import { selectedAccountReducer } from '@suite/account';
import { createTestStore } from '@suite-common/test-utils';

import fixtures from './__fixtures__/selectedAccountActions';
import { syncSelectedAccountThunk } from './selectedAccountActions';

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
const mockStore = (preloadedState: State) =>
    createTestStore({
        extra: undefined,
        reducer: (state = preloadedState, action) => ({
            ...state,
            wallet: {
                ...state.wallet,
                selectedAccount: selectedAccountReducer(state.wallet.selectedAccount, action),
            },
        }),
        preloadedState,
    });

describe('selectedAccount Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const state = getInitialState(f.initialState);
            const store = mockStore(state);
            store.dispatch(syncSelectedAccountThunk(f.action as any));
            expect(store.getState().wallet.selectedAccount).toMatchObject(f.result as any);
        });
    });
});
