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
                onSend={jest.fn()}
                isConsentRequested={true}
                isPastDeadline={false}
                isSendInProgress={false}
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

    it('should be disabled when the transaction validity deadline has passed', async () => {
        const { getByTestId } = await renderReviewOutputsFooter({ isPastDeadline: true });

        expect(getByTestId('TEST_ID/submit-button')).toBeDisabled();
    });

    it('should call onSend on press', async () => {
        const onSend = jest.fn();
        const { getByTestId } = await renderReviewOutputsFooter({ onSend });

        await userEvent.press(getByTestId('TEST_ID/submit-button'));

        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should display loading state while sending', async () => {
        const { getByTestId } = await renderReviewOutputsFooter({ isSendInProgress: true });

        expect(getByTestId('TEST_ID/submit-button/loading')).toBeOnTheScreen();
    });
});
