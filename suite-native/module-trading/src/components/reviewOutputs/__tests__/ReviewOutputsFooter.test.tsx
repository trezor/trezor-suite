import { userEvent } from '@suite-native/test-utils-store';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { ReviewOutputsFooter, type ReviewOutputsFooterProps } from '../ReviewOutputsFooter';

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

        expect(getByTestId('TEST_ID/submit-button')).toHaveTextContent('Send transaction');
        expect(getByTestId('TEST_ID/submit-button')).toBeEnabled();
    });

    it('should be disabled when isConsentRequested is false', () => {
        const { getByText } = renderReviewOutputsFooter({ isConsentRequested: false });

        expect(getByText('Send transaction')).toBeDisabled();
    });

    it('should display "all set" info when transaction is signed', () => {
        const { getByText } = renderReviewOutputsFooter(
            { isConsentRequested: true },
            {
                wallet: {
                    send: {
                        serializedTx: {
                            tx: 'tx',
                            symbol: 'btc',
                        },
                    },
                },
            },
        );

        expect(
            getByText('Everything is ready, you can send the transaction now.'),
        ).toBeOnTheScreen();
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
