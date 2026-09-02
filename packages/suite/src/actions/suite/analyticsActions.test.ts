import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type AnalyticsRootState,
    type AnalyticsState,
    analyticsActions,
    analyticsInitialState,
} from '@suite-common/analytics-redux';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestStore } from '@suite-common/test-utils';

import { init } from 'src/actions/suite/analyticsActions';

const extra: WithServices<DesktopAnalyticsDep> = {
    services: { analytics: mockDesktopAnalytics() },
};

type InitialState = {
    analytics: Partial<AnalyticsState>;
};

const getInitialState = ({ analytics }: InitialState): AnalyticsRootState => ({
    analytics: {
        ...analyticsInitialState,
        ...analytics,
    },
});

const mockStore = (preloadedState: AnalyticsRootState) =>
    createTestStore({
        extra,
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
