import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import analyticsReducer from '@suite-reducers/analyticsReducer';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { ANALYTICS } from '../constants';

type AnalyticsState = ReturnType<typeof analyticsReducer>;

interface InitialState {
    analytics?: Partial<AnalyticsState>;
}

jest.mock('@suite-utils/random', () => {
    return {
        __esModule: true, // this property makes it work
        getAnalyticsRandomId: () => 'very-random',
    };
});

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

const oldWindowLocation = window.location;

describe('Analytics Actions', () => {
    beforeAll(() => {
        // eslint-disable-next-line global-require
        require('@suite-utils/random');

        // @ts-ignore The operand of a 'delete' operator must be optional.
        delete window.location;

        // @ts-ignore
        window.location = {
            hostname: 'not-localhost',
        };
    });
    beforeEach(() => {
        const mockSuccessResponse = {};
        const mockJsonPromise = Promise.resolve(mockSuccessResponse);
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
        });
        // @ts-ignore
        global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
        // @ts-ignore
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);
    });

    afterAll(() => {
        // restore `window.location` to the `jsdom` `Location` object
        window.location = oldWindowLocation;
    });

    it('analyticsActions.report() - should report if enabled (desktop)', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState({
            analytics: { enabled: true, instanceId: '1', sessionId: 'very-random' },
        });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/desktop/beta.log?c_v=1.5&c_type=switch-device%2Feject&c_instance_id=1&c_session_id=very-random',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - should report if enabled (web)', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'web';
        const state = getInitialState({
            analytics: { enabled: true, instanceId: '1', sessionId: 'very-random' },
        });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/web/develop.log?c_v=1.5&c_type=switch-device%2Feject&c_instance_id=1&c_session_id=very-random',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - should not report if not enabled', () => {
        const state = getInitialState({
            analytics: { enabled: false },
        });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('analyticsActions.report() - enabled: false, force: false', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'web';
        const state = getInitialState({
            analytics: { enabled: false },
        });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.init() - optout false', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(
            analyticsActions.init(
                {
                    enabled: undefined,
                    sessionId: undefined,
                    instanceId: undefined,
                },
                false,
            ),
        );
        expect(store.getActions()).toMatchObject([
            {
                type: ANALYTICS.INIT,
                payload: { enabled: false, sessionId: 'very-random', instanceId: 'very-random' },
            },
        ]);
    });

    it('analyticsActions.init(true) - output true', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(
            analyticsActions.init(
                { enabled: undefined, sessionId: undefined, instanceId: undefined },
                true,
            ),
        );
        expect(store.getActions()).toMatchObject([
            {
                type: ANALYTICS.INIT,
                payload: { enabled: true, sessionId: 'very-random', instanceId: 'very-random' },
            },
        ]);
    });

    it('analyticsActions.enable/dispose', () => {
        const state = getInitialState({});
        const store = initStore(state);
        store.dispatch(analyticsActions.enable());
        expect(store.getState()).toMatchObject({
            analytics: { enabled: true },
        });
        store.dispatch(analyticsActions.dispose());
        expect(store.getState()).toMatchObject({
            analytics: { enabled: false },
        });
    });
});
