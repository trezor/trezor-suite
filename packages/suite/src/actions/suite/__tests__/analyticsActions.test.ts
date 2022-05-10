import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import analyticsReducer from '@suite-reducers/analyticsReducer';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { ANALYTICS } from '../constants';

type AnalyticsState = ReturnType<typeof analyticsReducer>;

interface InitialState {
    analytics?: Partial<AnalyticsState>;
}

jest.mock('@suite-utils/random', () => ({
    __esModule: true,
    getTrackingRandomId: () => 'very-random',
}));

export const getInitialState = (state: InitialState | undefined) => {
    const analytics = state ? state.analytics : undefined;
    return {
        suite: {
            tor: false,
            flags: { initialRun: false },
        },
        analytics: {
            ...analyticsReducer(undefined, { type: 'foo' } as any),
            ...analytics,
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { analytics } = store.getState();
        store.getState().analytics = analyticsReducer(analytics, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Analytics Actions', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('analyticsActions.init() - unconfirmed', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(
            analyticsActions.init({
                enabled: undefined,
                confirmed: false,
                sessionId: undefined,
                instanceId: undefined,
            }),
        );
        store.dispatch(
            analyticsActions.init({
                enabled: false,
                confirmed: false,
                sessionId: undefined,
                instanceId: undefined,
            }),
        );
        store.dispatch(
            analyticsActions.init({
                enabled: true,
                confirmed: false,
                sessionId: undefined,
                instanceId: undefined,
            }),
        );

        const unconfirmedInitAction = {
            type: ANALYTICS.INIT,
            payload: { enabled: true, sessionId: 'very-random', instanceId: 'very-random' },
        };

        expect(store.getActions()).toMatchObject([
            unconfirmedInitAction,
            unconfirmedInitAction,
            unconfirmedInitAction,
        ]);
    });

    it('analyticsActions.init() - enabled confirmed', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(
            analyticsActions.init({
                enabled: true,
                sessionId: undefined,
                instanceId: undefined,
                confirmed: true,
            }),
        );
        expect(store.getActions()).toMatchObject([
            {
                type: ANALYTICS.INIT,
                payload: { enabled: true, sessionId: 'very-random', instanceId: 'very-random' },
            },
        ]);
    });

    it('analyticsActions.init() - disabled confirmed', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(
            analyticsActions.init({
                enabled: false,
                sessionId: undefined,
                instanceId: undefined,
                confirmed: true,
            }),
        );
        expect(store.getActions()).toMatchObject([
            {
                type: ANALYTICS.INIT,
                payload: { enabled: false, sessionId: 'very-random', instanceId: 'very-random' },
            },
        ]);
    });

    it('analyticsActions.enable/dispose', () => {
        const state = getInitialState({});
        const store = initStore(state);

        store.dispatch(analyticsActions.enable());
        expect(store.getState()).toMatchObject({
            analytics: { enabled: true, confirmed: true },
        });
        store.dispatch(analyticsActions.disable());
        expect(store.getState()).toMatchObject({
            analytics: { enabled: false, confirmed: true },
        });
    });
});
