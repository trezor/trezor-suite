import { analyticsActions, prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { configureMockStore } from '@suite-common/test-utils';

import { init } from 'src/actions/suite/analyticsActions';
import { extraDependencies } from 'src/support/extraDependencies';

const analyticsReducer = prepareAnalyticsReducer(extraDependencies);

type AnalyticsState = ReturnType<typeof analyticsReducer>;

type InitialState = {
    analytics: Partial<AnalyticsState>;
};

const getInitialState = (state?: InitialState) => ({
    analytics: {
        ...analyticsReducer(undefined, { type: 'foo' } as any),
        ...state?.analytics,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = (preloadedState: State) =>
    configureMockStore({
        reducer: (state = preloadedState, action) => ({
            ...state,
            analytics: analyticsReducer(state.analytics, action),
        }),
        preloadedState,
    });

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
        const store = mockStore(state);

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
        const store = mockStore(state);

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
        const store = mockStore(state);

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
