import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore } from 'src/support/tests/configureStore';
import { init } from 'src/actions/suite/analyticsActions';

import { prepareAnalyticsReducer, analyticsActions } from '@suite-common/analytics';

const analyticsReducer = prepareAnalyticsReducer(extraDependencies);

type AnalyticsState = ReturnType<typeof analyticsReducer>;

type InitialState = {
    analytics: Partial<AnalyticsState>;
};

export const getInitialState = (state?: InitialState) => ({
    analytics: {
        ...analyticsReducer(undefined, { type: 'foo' } as any),
        ...state?.analytics,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { analytics } = store.getState();
        store.getState().analytics = analyticsReducer(analytics, action);
        // Add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('analytics init thunks ', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('analytics init with unconfirmed', () => {
        const state = getInitialState({
            analytics: {
                enabled: undefined,
                confirmed: false,
                instanceId: 'very-random',
            },
        });
        const store = initStore(state);

        store.dispatch(init());
        expect(store.getActions()).toMatchObject([
            {
                type: analyticsActions.initAnalytics.type,
                payload: {
                    enabled: false,
                    confirmed: false,
                    instanceId: 'very-random',
                },
            },
        ]);
    });

    it('analytics init with confirmed', () => {
        const state = getInitialState({
            analytics: {
                enabled: undefined,
                confirmed: true,
                instanceId: 'very-random',
            },
        });
        const store = initStore(state);

        store.dispatch(init());
        expect(store.getActions()).toMatchObject([
            {
                type: analyticsActions.initAnalytics.type,
                payload: {
                    enabled: false,
                    confirmed: true,
                    instanceId: 'very-random',
                },
            },
        ]);
    });

    it('analytics init with confirmed but not enabled', () => {
        const state = getInitialState({
            analytics: {
                enabled: false,
                confirmed: true,
                instanceId: 'very-random',
            },
        });
        const store = initStore(state);

        store.dispatch(init());
        expect(store.getActions()).toMatchObject([
            {
                type: analyticsActions.initAnalytics.type,
                payload: {
                    enabled: false,
                    confirmed: true,
                    instanceId: 'very-random',
                },
            },
        ]);
    });
});
