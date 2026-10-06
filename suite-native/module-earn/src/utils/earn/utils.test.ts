import { getEarnReviewErrorReaction } from './utils';

describe('getEarnReviewErrorReaction', () => {
    it('ignores a validity-timer timeout so the expired alert keeps the review screen open', () => {
        expect(
            getEarnReviewErrorReaction({
                error: 'sign-transaction-timeout',
                errorCode: 'Method_Cancel',
                message: 'tx-timeout',
            }),
        ).toBe('none');
    });

    it('ignores a user cancel reported via the tx-cancelled message', () => {
        expect(
            getEarnReviewErrorReaction({
                error: 'sign-transaction-failed',
                message: 'tx-cancelled',
            }),
        ).toBe('none');
    });

    it('pops the review screen when the user cancels on the device', () => {
        expect(
            getEarnReviewErrorReaction({
                error: 'sign-transaction-failed',
                errorCode: 'Method_Cancel',
            }),
        ).toBe('popScreen');
    });

    it('reacts with the push failed alert for a failed broadcast', () => {
        expect(getEarnReviewErrorReaction({ error: 'push-transaction-failed' })).toBe('pushFailed');
    });

    it('reacts with the device disconnected alert for unknown errors', () => {
        expect(
            getEarnReviewErrorReaction({
                error: 'sign-transaction-failed',
                message: 'unknown-error',
            }),
        ).toBe('deviceDisconnected');
    });

    it('reacts with the sign-transaction-failed alert for a live-state validation rejection, not device disconnected', () => {
        expect(
            getEarnReviewErrorReaction({
                error: 'stake-live-state-invalid',
                message: 'Max Amount For Unstake 1',
            }),
        ).toBe('signFailed');
    });
});
