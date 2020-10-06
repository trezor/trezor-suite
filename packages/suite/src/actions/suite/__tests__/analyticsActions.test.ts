import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import analyticsReducer from '@suite-reducers/analyticsReducer';
import * as analyticsActions from '@suite-actions/analyticsActions';

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
        const state = getInitialState({ analytics: { enabled: true, instanceId: '1' } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/desktop/beta.log?c_v=1.1&c_type=switch-device%2Feject&c_instance_id=1&c_session_id=very-random',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - should report if enabled (web)', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'web';
        const state = getInitialState({ analytics: { enabled: true, instanceId: '1' } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/web/develop.log?c_v=1.1&c_type=switch-device%2Feject&c_instance_id=1&c_session_id=very-random',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - should not report if not enabled', () => {
        const state = getInitialState({ analytics: { enabled: false } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('analyticsActions.report() - should not report if enabled but on localhost', () => {
        window.location.hostname = 'localhost';
        const state = getInitialState({ analytics: { enabled: true } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'switch-device/eject' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
    });
});
