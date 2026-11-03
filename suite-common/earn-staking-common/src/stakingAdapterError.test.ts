import { StakingAdapterError, isStakingAdapterError } from './stakingAdapterError';

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
