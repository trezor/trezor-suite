import {
    StakingAdapterError,
    getStakingSigningErrorCode,
    isStakingAdapterError,
} from './stakingAdapterError';

describe('StakingAdapterError', () => {
    it('carries the code as its name-safe message', () => {
        const error = new StakingAdapterError('report-failed');

        expect(error.code).toBe('report-failed');
        expect(error.message).toBe('report-failed');
        expect(error.name).toBe('StakingAdapterError');
        expect(error).toBeInstanceOf(Error);
    });

    it('is told apart from other errors', () => {
        expect(isStakingAdapterError(new StakingAdapterError('live-state-invalid'))).toBe(true);
        expect(isStakingAdapterError(new Error('report-failed'))).toBe(false);
        expect(isStakingAdapterError('report-failed')).toBe(false);
    });
});

describe('getStakingSigningErrorCode', () => {
    it('maps a device or app cancellation to the cancelled code', () => {
        expect(getStakingSigningErrorCode({ error: 'tx-cancelled' })).toBe('signing-cancelled');
        expect(
            getStakingSigningErrorCode({ error: 'Cancelled', code: 'Failure_ActionCancelled' }),
        ).toBe('signing-cancelled');
        expect(getStakingSigningErrorCode({ error: 'PIN', code: 'Failure_PinCancelled' })).toBe(
            'signing-cancelled',
        );
        expect(getStakingSigningErrorCode({ error: 'Cancelled', code: 'Method_Cancel' })).toBe(
            'signing-cancelled',
        );
    });

    it('maps the validity timeout to the expired code, whatever its connect code', () => {
        expect(getStakingSigningErrorCode({ error: 'tx-timeout', code: 'Method_Cancel' })).toBe(
            'signing-expired',
        );
    });

    it('keeps the connect code, or the message when there is none, for any other failure', () => {
        expect(getStakingSigningErrorCode({ error: 'Invalid', code: 'Failure_DataError' })).toBe(
            'Failure_DataError',
        );
        expect(getStakingSigningErrorCode({ error: 'Device disconnected' })).toBe(
            'Device disconnected',
        );
    });
});
