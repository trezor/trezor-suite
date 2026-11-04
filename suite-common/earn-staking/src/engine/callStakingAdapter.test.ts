import { StakingAdapterError } from '@suite-common/earn-staking-common';

import { callStakingAdapter, warnStakingAdapterFailure } from './callStakingAdapter';

describe('callStakingAdapter', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the payload of a call that resolves', async () => {
        expect(await callStakingAdapter(() => Promise.resolve({ txid: 'tx1' }))).toEqual({
            success: true,
            payload: { txid: 'tx1' },
        });
    });

    it('keeps the code of an adapter error and logs it', async () => {
        const error = new StakingAdapterError('report-failed');
        const result = await callStakingAdapter(() => Promise.reject(error));

        expect(result).toEqual({ success: false, code: 'report-failed', error });

        if (!result.success) warnStakingAdapterFailure('vote broadcast', result);

        expect(console.warn).toHaveBeenCalledWith('Staking vote broadcast failed: report-failed');
    });

    it('logs only the name of any other error', async () => {
        const error = new TypeError('secret payload');
        const result = await callStakingAdapter(() => Promise.reject(error));

        expect(result).toEqual({ success: false, code: null, error });

        if (!result.success) warnStakingAdapterFailure('stake compose', result);

        expect(console.warn).toHaveBeenCalledWith('Staking stake compose failed: TypeError');
    });
});
