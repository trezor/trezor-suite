import { testMocks } from '@suite-common/test-utils';

import { configureStore } from 'src/support/tests/configureStore';
import settingsReducer from 'src/reducers/wallet/settingsReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import fixtures from '../__fixtures__/walletSettings';

export const getInitialState = (settings?: any) => ({
    suite: { ...suiteReducer(undefined, { type: 'foo' } as any) },
    wallet: {
        settings: {
            ...settingsReducer(undefined, { type: 'foo' } as any),
            ...settings,
        },
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

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

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

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
