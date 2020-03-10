import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import settingsReducer from '@wallet-reducers/settingsReducer';
import fixtures from '../__fixtures__/walletSettings';

export const getInitialState = (settings?: any) => {
    return {
        wallet: {
            settings: {
                ...settingsReducer(undefined, { type: 'foo' } as any),
                ...settings,
            },
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { settings } = store.getState().wallet;
        store.getState().wallet.settings = settingsReducer(settings, action);
        store.getActions().push(action);
    });
    return store;
};

describe('walletSettings Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState(f.initialState);
            const store = initStore(state);
            await store.dispatch(f.action());
            expect(store.getState().wallet.settings).toMatchObject(f.result);
        });
    });
});
