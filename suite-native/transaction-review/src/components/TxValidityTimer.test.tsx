import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TxValidityTimer } from './TxValidityTimer';

const tryAgainLabel = getTranslation('generic.buttons.tryAgain');
const confirmingLabel = getTranslation('transactionManagement.txValidityTimer.confirming');
const expiredLabel = getTranslation('transactionManagement.txValidityTimer.expiredTitle');
const getCountdownLabel = (seconds: number) =>
    getTranslation('transactionManagement.txValidityTimer.countdown', { seconds });

describe('TxValidityTimer', () => {
    const defaultProps = {
        secondsLeft: 42,
        isPastDeadline: false,
        onRetry: jest.fn(),
    };

    const renderTimer = async (props: Partial<React.ComponentProps<typeof TxValidityTimer>> = {}) =>
        await renderWithBasicProvider(<TxValidityTimer {...defaultProps} {...props} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('label', () => {
        it('should show the remaining seconds countdown by default', async () => {
            const { getByText } = await renderTimer({ secondsLeft: 42 });

            expect(getByText(getCountdownLabel(42))).toBeOnTheScreen();
        });

        it('should show the expired label when past the deadline', async () => {
            const { getByText } = await renderTimer({ isPastDeadline: true });

            expect(getByText(expiredLabel)).toBeOnTheScreen();
        });

        it('should show the confirming label while broadcasting', async () => {
            const { getByText } = await renderTimer({ isBroadcasting: true });

            expect(getByText(confirmingLabel)).toBeOnTheScreen();
        });

        it('should prioritize the confirming label over the expired label while broadcasting', async () => {
            const { getByText, queryByText } = await renderTimer({
                isBroadcasting: true,
                isPastDeadline: true,
            });

            expect(getByText(confirmingLabel)).toBeOnTheScreen();
            expect(queryByText(expiredLabel)).toBeNull();
        });
    });

    describe('retry button', () => {
        it('should call onRetry when the retry button is pressed', async () => {
            const onRetry = jest.fn();
            const { getByText } = await renderTimer({ onRetry });

            await fireEvent.press(getByText(tryAgainLabel));

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should keep the retry button enabled by default', async () => {
            const { getByText } = await renderTimer();

            expect(getByText(tryAgainLabel)).toBeEnabled();
        });

        it('should disable the retry button when retry is on cooldown', async () => {
            const { getByText } = await renderTimer({ isRetryDisabled: true });

            expect(getByText(tryAgainLabel)).toBeDisabled();
        });

        it('should disable the retry button and not call onRetry while broadcasting', async () => {
            const onRetry = jest.fn();
            const { getByText } = await renderTimer({ isBroadcasting: true, onRetry });

            const retryButton = getByText(tryAgainLabel);
            expect(retryButton).toBeDisabled();

            await fireEvent.press(retryButton);
            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    describe('compact layout', () => {
        it('should keep the countdown and a working retry button', async () => {
            const onRetry = jest.fn();
            const { getByText } = await renderTimer({ isCompact: true, onRetry });

            expect(getByText(getCountdownLabel(42))).toBeOnTheScreen();

            await fireEvent.press(getByText(tryAgainLabel));

            expect(onRetry).toHaveBeenCalledTimes(1);
        });
    });
});
