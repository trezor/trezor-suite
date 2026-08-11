import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';

import { ReviewOutputsFooter, type ReviewOutputsFooterProps } from './ReviewOutputsFooter';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('ReviewOutputsFooter', () => {
    const renderReviewOutputsFooter = (
        props: Partial<ReviewOutputsFooterProps>,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <ReviewOutputsFooter
                resolveConsent={jest.fn()}
                isConsentRequested={true}
                testID="TEST_ID"
                {...props}
            />,
            { overrides },
        );

    it('should display "Send transaction" button', () => {
        const { getByTestId } = renderReviewOutputsFooter({});

        expect(getByTestId('TEST_ID/submit-button')).toHaveTextContent(
            getTranslation('moduleTrading.tradingReviewOutputs.submitButton'),
        );
        expect(getByTestId('TEST_ID/submit-button')).toBeEnabled();
    });

    it('should be disabled when isConsentRequested is false', () => {
        const { getByText } = renderReviewOutputsFooter({ isConsentRequested: false });

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.submitButton')),
        ).toBeDisabled();
    });

    it('should resolveConsent on press', async () => {
        const resolveConsent = jest.fn();
        const { getByTestId } = renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('TEST_ID/submit-button'));

        expect(resolveConsent).toHaveBeenCalledWith(true);
        expect(getByTestId('TEST_ID/submit-button/loading')).toBeOnTheScreen();
    });

    it('should resolveConsent only once', async () => {
        const resolveConsent = jest.fn();
        const { getByTestId } = renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('TEST_ID/submit-button'));
        await userEvent.press(getByTestId('TEST_ID/submit-button'));

        expect(resolveConsent).toHaveBeenCalledTimes(1);
    });
});
