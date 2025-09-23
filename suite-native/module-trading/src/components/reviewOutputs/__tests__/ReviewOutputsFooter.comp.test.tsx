import { PreloadedState, renderWithStoreProviderAsync, userEvent } from '@suite-native/test-utils';

import { ReviewOutputsFooter, ReviewOutputsFooterProps } from '../ReviewOutputsFooter';

describe('ReviewOutputsFooter', () => {
    const renderReviewOutputsFooter = (
        props: Partial<ReviewOutputsFooterProps>,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ReviewOutputsFooter resolveConsent={jest.fn()} isConsentRequested={true} {...props} />,
            { preloadedState },
        );

    it('should display "Send transaction" button', async () => {
        const { getByTestId } = await renderReviewOutputsFooter({});

        expect(getByTestId('@trading/send-transaction-button')).toHaveTextContent(
            'Send transaction',
        );
        expect(getByTestId('@trading/send-transaction-button')).toBeEnabled();
    });

    it('should be disabled when isConsentRequested is false', async () => {
        const { getByText } = await renderReviewOutputsFooter({ isConsentRequested: false });

        expect(getByText('Send transaction')).toBeDisabled();
    });

    it('should display "all set" info when transaction is signed', async () => {
        const { getByText } = await renderReviewOutputsFooter(
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
        const { getByTestId } = await renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('@trading/send-transaction-button'));

        expect(resolveConsent).toHaveBeenCalledWith(true);
        expect(getByTestId('@trading/send-transaction-button')).not.toHaveTextContent(
            'Send transaction',
        );
    });

    it('should resolveConsent only once', async () => {
        const resolveConsent = jest.fn();
        const { getByTestId } = await renderReviewOutputsFooter({ resolveConsent });

        await userEvent.press(getByTestId('@trading/send-transaction-button'));
        await userEvent.press(getByTestId('@trading/send-transaction-button'));

        expect(resolveConsent).toHaveBeenCalledTimes(1);
    });
});
