import { getSignAndPushRejectionError } from './tradingErrorUtils';
import { type TradingSignAndPushError } from '../types';

describe('getSignAndPushRejectionError', () => {
    it('returns the send form error the step rejected with', () => {
        const pushError: TradingSignAndPushError = {
            error: 'push-transaction-failed',
            metadata: {
                success: false,
                error: { code: 'Backend_Error', message: 'Blockhash not found' },
            },
        };

        expect(
            getSignAndPushRejectionError({ payload: pushError, error: { message: 'Rejected' } }),
        ).toBe(pushError);
    });

    it('keeps the thrown message as a signing failure when the step rejected without an error', () => {
        expect(getSignAndPushRejectionError({ error: { message: 'Unexpected failure' } })).toEqual({
            error: 'sign-transaction-failed',
            message: 'Unexpected failure',
        });
    });
});
