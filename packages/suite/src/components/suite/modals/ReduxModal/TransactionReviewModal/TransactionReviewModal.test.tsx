import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { closeModal } from '@suite/modal';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type WithServices } from '@trezor/redux-utils';
import { createDeferred } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TransactionReviewModal } from './TransactionReviewModal';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

describe('TransactionReviewModal', () => {
    it('closes and declines the pending decision if the signed review loses its transaction details', async () => {
        const { services } = createTestCompositionRoot<
            WithServices<DesktopAnalyticsDep>,
            MockSuiteState
        >({
            preloadedState: {
                ...mockInitialAppState,
                device: { ...mockInitialAppState.device, selectedDevice: mockSuiteDevice() },
            },
            services: () => ({ analytics: mockDesktopAnalytics() }),
        });
        const decision = createDeferred<boolean, string | number | undefined>();

        renderWithProviders(
            services,
            <TransactionReviewModal type="review-transaction" decision={decision} />,
        );

        expect(
            screen.queryByTestId('@suite/modal/confirm-action-on-device'),
        ).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /^Close$/ }));
        expect(services.store.getActions()).toContainEqual(closeModal());
        await expect(decision.promise).resolves.toBe(false);
    });
});
