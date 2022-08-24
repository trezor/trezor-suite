import { configureStore } from '@suite/support/tests/configureStore';

import pollingReducer, { initialState } from '@wallet-reducers/pollingReducer';
import pollingMiddleware from '@wallet-middlewares/pollingMiddleware';
import type { Action } from '@suite-types';
import { POLLING } from '@wallet-actions/constants';
import type { PollingAction } from '@wallet-actions/pollingActions';

type PollingState = ReturnType<typeof pollingReducer>;
interface Args {
    pollings?: PollingState;
}

export const getInitialState = ({ pollings }: Args = {}) => ({
    wallet: {
        pollings: pollings || pollingReducer({}, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([pollingMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { pollings } = store.getState().wallet;
        store.getState().wallet = {
            pollings: pollingReducer(pollings, action),
        };

        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('pollingMiddleware', () => {
    jest.useFakeTimers();

    it('start', () => {
        const store = initStore(
            getInitialState({
                pollings: initialState,
            }),
        );

        store.dispatch({
            type: POLLING.START,
            key: 'fake' as any,
            pollingFunction: () => {},
            intervalMs: 0,
        } as PollingAction);

        expect(store.getActions()).toEqual([
            {
                type: POLLING.START,
                key: 'fake',
                pollingFunction: expect.any(Function),
                intervalMs: 0,
            },
            { type: POLLING.REQUEST, key: 'fake' },
        ]);
    });

    it('request', () => {
        jest.spyOn(global, 'setTimeout');
        const store = initStore(
            getInitialState({
                pollings: {
                    ...initialState,
                    fake: {
                        intervalMs: 0,
                        counter: 0,
                        maxPollingRequestCount: 10,
                        pollingFunction: () => Promise.resolve(),
                    },
                },
            }),
        );

        store.dispatch({
            type: POLLING.REQUEST,
            key: 'fake' as any,
        } as PollingAction);

        jest.runOnlyPendingTimers();

        expect(store.getActions()).toEqual([{ type: POLLING.REQUEST, key: 'fake' }]);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('stop', () => {
        const store = initStore(
            getInitialState({
                pollings: initialState,
            }),
        );

        store.dispatch({
            type: POLLING.STOP,
            key: 'fake' as any,
        } as PollingAction);

        expect(store.getActions()).toEqual([
            {
                type: POLLING.STOP,
                key: 'fake',
            },
        ]);
    });
});
