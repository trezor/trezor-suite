import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE, FIRMWARE } from '@suite-actions/constants';

import firmwareReducer from '@suite-reducers/firmwareReducer';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import firmwareMiddleware from '@suite-middlewares/firmwareMiddleware';

const middlewares = [firmwareMiddleware];

type FirmwareState = ReturnType<typeof firmwareReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

export const getInitialState = (
    router?: Partial<RouterState>,
    firmware?: Partial<FirmwareState>,
    suite?: Partial<SuiteState>,
) => {
    return {
        firmware: {
            ...firmwareReducer(undefined, { type: 'foo' } as any),
            ...firmware,
        },
        router: {
            ...routerReducer(undefined, { type: 'foo' } as any),
            ...router,
        },
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
    };
};

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([thunk, ...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, suite } = store.getState();
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().suite = suiteReducer(suite, action);

        store.getActions().push(action);
    });
    return store;
};

describe('firmware middleware', () => {
    describe('SUITE.APP_CHANGED', () => {
        it('payload=firwmare (into firmware)', async () => {
            const store = initStore(getInitialState());
            store.dispatch({ type: SUITE.APP_CHANGED, payload: 'firmware' });

            const result = store.getActions();
            expect(result).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'firmware' },
                { type: FIRMWARE.ENABLE_REDUCER, payload: true },
                { type: SUITE.LOCK_ROUTER, payload: true },
            ]);
        });

        it('from firmware', async () => {
            const store = initStore(getInitialState({ app: 'firmware' }));
            store.dispatch({ type: SUITE.APP_CHANGED, payload: 'wallet' });

            const result = store.getActions();

            expect(result).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'wallet' },
                { type: FIRMWARE.RESET_REDUCER },
            ]);
        });
    });
});
