import '@suite-common/test-utils/globalOverrides';

import { act, fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { sendFeedbackThunk } from '@suite-common/feedback';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type WithServices } from '@trezor/redux-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EarnFlowFeedbackCard } from './EarnFlowFeedbackCard';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackThunk: jest.fn(() => () => ({
        unwrap: () => Promise.reject(new Error('Request failed')),
    })),
}));

describe('EarnFlowFeedbackCard', () => {
    it('keeps a rejected draft without reporting a successful submission', async () => {
        const analytics = mockDesktopAnalytics();
        const { services } = createTestCompositionRoot<
            WithServices<DesktopAnalyticsDep>,
            MockSuiteState
        >({
            preloadedState: mockInitialAppState,
            services: () => ({ analytics }),
        });
        renderWithProviders(
            services,
            <EarnFlowFeedbackCard
                featureTitleId="TR_EARN_DEFI_YIELD"
                feature="yield"
                context="deposit"
                feedbackContext={{ vaultId: 'public-vault-id' }}
            />,
        );

        fireEvent.click(screen.getByTestId('@feedback/card/rating/4'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Feedback draft' } });
        await act(() => {
            fireEvent.click(screen.getByTestId('@feedback/form-modal/submit-button'));
        });

        expect(sendFeedbackThunk).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'feedback/rating-selected',
            payload: {
                category: 'yield',
                context: 'deposit',
                provider: 'public-vault-id',
                rating: '4',
            },
        });
        fireEvent.click(screen.getByTestId('@modal/close-button'));
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('@feedback/card/rating/4'));

        expect(screen.getByRole('textbox')).toHaveValue('Feedback draft');
    });
});
