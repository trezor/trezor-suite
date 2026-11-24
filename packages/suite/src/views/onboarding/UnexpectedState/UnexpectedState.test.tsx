import { screen } from '@testing-library/react';

import { createRouterStateMockForRoute } from '@suite/router/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { UnexpectedState } from './UnexpectedState';
import { type MockSuiteState, mockInitialAppState, renderWithProviders } from '../../../../mocks';

describe('initialized devices in onboarding', () => {
    it.each([
        ['security-check', false],
        ['firmware', false],
        ['authenticate-device', false],
        ['tutorial', false],
        ['create-or-recover', false],
        ['backup-type', false],
        ['security', true],
        ['recovery', true],
        ['set-pin', true],
        ['final', true],
    ] as const)('handles an initialized device at %s', (activeStepId, shouldContinue) => {
        const initialState: MockSuiteState = {
            ...mockInitialAppState,
            router: createRouterStateMockForRoute('onboarding-index'),
            device: {
                ...mockInitialAppState.device,
                selectedDevice: mockSuiteDevice({ connected: true, available: true }),
            },
            onboarding: {
                ...mockInitialAppState.onboarding,
                isActive: true,
                activeStepId,
            },
        };
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            preloadedState: initialState,
        });
        const { unmount } = renderWithProviders(
            services,
            <UnexpectedState>
                <div data-testid="step-content" />
            </UnexpectedState>,
        );

        if (shouldContinue) {
            expect(screen.getByTestId('step-content')).toBeInTheDocument();
        } else {
            expect(screen.queryByTestId('step-content')).toBeNull();
            expect(
                screen.getByTestId('@onboarding/unexpected-state/is-same/start-over-button'),
            ).toBeVisible();
        }
        unmount();
    });
});
