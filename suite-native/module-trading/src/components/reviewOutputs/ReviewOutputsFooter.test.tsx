import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';

import { ReviewOutputsFooter, type ReviewOutputsFooterProps } from './ReviewOutputsFooter';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('ReviewOutputsFooter', () => {
    const renderReviewOutputsFooter = async (
        props: Partial<ReviewOutputsFooterProps>,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <ReviewOutputsFooter
                resolveConsent={jest.fn()}
                isConsentRequested={true}
                testID="TEST_ID"
                {...props}
            />,
            { overrides },
        );

    it('should display "Send transaction" button', async () => {
        const { getByTestId } = await renderReviewOutputsFooter({});

        expect(getByTestId('TEST_ID/submit-button')).toHaveTextContent(
            getTranslation('moduleTrading.tradingReviewOutputs.submitButton'),
        );
        expect(getByTestId('TEST_ID/submit-button')).toBeEnabled();
    });

    it('should be disabled when isConsentRequested is false', async () => {
        const { getByText } = await renderReviewOutputsFooter({ isConsentRequested: false });

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.submitButton')),
        ).toBeDisabled();
    });

    it('should resolveConsent on press', async () => {
        const resolveConsent = jest.fn();
        const { getByTestId } = await renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('TEST_ID/submit-button'));

        expect(resolveConsent).toHaveBeenCalledWith(true);
        expect(getByTestId('TEST_ID/submit-button/loading')).toBeOnTheScreen();
    });

    it('should resolveConsent only once', async () => {
        const resolveConsent = jest.fn();
        const { getByTestId } = await renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('TEST_ID/submit-button'));
        await userEvent.press(getByTestId('TEST_ID/submit-button'));

        expect(resolveConsent).toHaveBeenCalledTimes(1);
    });
});
