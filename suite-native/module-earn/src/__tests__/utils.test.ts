import { handleEarnReviewError } from '../utils';

const buildHandlers = () => ({
    navigation: { pop: jest.fn() },
    showPushTransactionFailedAlert: jest.fn(),
    showPendingTransactionConflictAlert: jest.fn(),
    showDeviceDisconnectedAlert: jest.fn(),
});

const expectNoReaction = (handlers: ReturnType<typeof buildHandlers>) => {
    expect(handlers.navigation.pop).not.toHaveBeenCalled();
    expect(handlers.showPushTransactionFailedAlert).not.toHaveBeenCalled();
    expect(handlers.showPendingTransactionConflictAlert).not.toHaveBeenCalled();
    expect(handlers.showDeviceDisconnectedAlert).not.toHaveBeenCalled();
};

describe('handleEarnReviewError', () => {
    it('ignores a validity-timer timeout so the expired alert keeps the review screen open', () => {
        const handlers = buildHandlers();

        handleEarnReviewError({
            payload: {
                error: 'sign-transaction-timeout',
                errorCode: 'Method_Cancel',
                message: 'tx-timeout',
            },
            ...handlers,
        });

        expectNoReaction(handlers);
    });

    it('ignores a user cancel reported via the tx-cancelled message', () => {
        const handlers = buildHandlers();

        handleEarnReviewError({
            payload: { error: 'sign-transaction-failed', message: 'tx-cancelled' },
            ...handlers,
        });

        expectNoReaction(handlers);
    });

    it('pops the review screen when the user cancels on the device', () => {
        const handlers = buildHandlers();

        handleEarnReviewError({
            payload: { error: 'sign-transaction-failed', errorCode: 'Method_Cancel' },
            ...handlers,
        });

        expect(handlers.navigation.pop).toHaveBeenCalledTimes(1);
        expect(handlers.showDeviceDisconnectedAlert).not.toHaveBeenCalled();
    });

    it('shows the push failed alert for a failed broadcast', () => {
        const handlers = buildHandlers();

        handleEarnReviewError({
            payload: { error: 'push-transaction-failed' },
            ...handlers,
        });

        expect(handlers.showPushTransactionFailedAlert).toHaveBeenCalledTimes(1);
        expect(handlers.navigation.pop).not.toHaveBeenCalled();
    });

    it('falls back to the device disconnected alert for unknown errors', () => {
        const handlers = buildHandlers();

        handleEarnReviewError({
            payload: { error: 'sign-transaction-failed', message: 'unknown-error' },
            ...handlers,
        });

        expect(handlers.showDeviceDisconnectedAlert).toHaveBeenCalledTimes(1);
        expect(handlers.navigation.pop).not.toHaveBeenCalled();
    });
});
