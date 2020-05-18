import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import analyticsReducer from '@suite-reducers/analyticsReducer';
import * as analyticsActions from '@suite-actions/analyticsActions';

type AnalyticsState = ReturnType<typeof analyticsReducer>;

interface InitialState {
    analytics?: Partial<AnalyticsState>;
}

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

describe('Analytics Actions', () => {
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

    it('analyticsActions.report() - should report if enabled', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState({ analytics: { enabled: true, instanceId: '1' } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'ui', payload: 'test-bla-bla' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/desktop/beta.log?instanceId=1&type=ui&payload=test-bla-bla',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - event with complex payload including array', () => {
        const env = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState({ analytics: { enabled: true, instanceId: '1' } });
        const store = initStore(state);
        store.dispatch(
            analyticsActions.report({
                type: 'suite-ready',
                payload: {
                    enabledNetworks: ['btc', 'bch'],
                    language: 'en',
                    localCurrency: 'usd',
                    discreetMode: false,
                },
            }),
        );
        // @ts-ignore
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            'https://data.trezor.io/suite/log/desktop/beta.log?instanceId=1&type=suite-ready&enabledNetworks=btc%2Cbch&language=en&localCurrency=usd&discreetMode=false',
            { method: 'GET' },
        );
        process.env.SUITE_TYPE = env;
    });

    it('analyticsActions.report() - should not report if not enabled', () => {
        const state = getInitialState({ analytics: { enabled: false } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'ui', payload: 'wrrr' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('analyticsActions.report() - should not report in dev', () => {
        const env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const state = getInitialState({ analytics: { enabled: true } });
        const store = initStore(state);
        store.dispatch(analyticsActions.report({ type: 'ui', payload: 'wrrr' }));
        // @ts-ignore
        expect(global.fetch).toHaveBeenCalledTimes(0);
        process.env.NODE_ENV = env;
    });
});
