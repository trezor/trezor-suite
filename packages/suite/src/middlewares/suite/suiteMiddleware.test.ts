import { recoveryReducer } from '@suite/recovery';
import { routerLocationChange, routerMiddleware, routerReducer } from '@suite/router';
import { createRouterStateMockForRoute } from '@suite/router/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { prepareSuiteMiddleware } from './suiteMiddleware';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

describe('returning from Settings to onboarding', () => {
    it.each(['onboarding-index', 'suite-index'] as const)(
        'preserves recovery only when Settings was opened from %s',
        backRouteName => {
            const initialState: MockSuiteState = {
                ...mockInitialAppState,
                router: {
                    ...createRouterStateMockForRoute('settings-device'),
                    settingsBackRoute: { name: backRouteName },
                },
                recovery: { ...mockInitialAppState.recovery, status: 'in-progress' },
            };
            const { services } = createTestCompositionRoot<void, MockSuiteState>({
                preloadedState: initialState,
                middleware: [
                    routerMiddleware(() => ({})),
                    prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
                ],
                reducer: (state = initialState, action) => ({
                    ...state,
                    router: routerReducer(state.router, action),
                    recovery: recoveryReducer(state.recovery, action),
                }),
            });

            services.store.dispatch(
                routerLocationChange(createRouterStateMockForRoute('onboarding-index')),
            );

            expect(services.store.getState().recovery.status).toBe(
                backRouteName === 'onboarding-index' ? 'in-progress' : 'initial',
            );
        },
    );
});
