import { type Reducer } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { getRoute, routerLocationChange, routerReducer } from '@suite/router';
import { createRouterStateMock } from '@suite/router/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mock } from '@trezor/dependency-injection';

import {
    type PrepareAnalyticsMiddlewareDeps,
    prepareAnalyticsMiddleware,
} from './analyticsMiddleware';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

describe('Earn entry analytics middleware', () => {
    it.each(['initial', 'loading', 'ready'] as const)(
        'reports one direct entry while Suite is %s',
        status => {
            const services: DesktopAnalyticsDep = {
                analytics: mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>()),
            };
            const initialState: MockSuiteState = {
                ...mockInitialAppState,
                suite: { ...mockInitialAppState.suite, lifecycle: { status } },
                router: createRouterStateMock({ route: undefined }),
            };
            const reducer: Reducer<MockSuiteState> = (state = initialState, action) => ({
                ...state,
                router: routerReducer(state.router, action),
            });
            const { store } = createTestCompositionRoot<
                PrepareAnalyticsMiddlewareDeps,
                MockSuiteState
            >({
                preloadedState: initialState,
                reducer,
                middleware: [prepareAnalyticsMiddleware(() => ({ services }))],
                services: () => services,
            }).services;
            const route = getRoute('suite-earn');
            if (route?.name !== 'suite-earn') throw new Error('The Earn route is missing');

            const action = routerLocationChange({
                pathname: '/earn',
                app: 'earn',
                route,
                params: undefined,
            });

            store.dispatch(action);
            store.dispatch(action);

            const entries = jest
                .mocked(services.analytics.report)
                .mock.calls.filter(([event]) => event.type === 'yield/earn-entry');
            expect(entries).toEqual([[{ type: 'yield/earn-entry', payload: { from: 'unknown' } }]]);
        },
    );
});
