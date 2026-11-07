import { getSendFormErrorCause } from './sendFormErrorUtils';
import { type SendFormError, type SendFormErrorCause } from './sendFormTypes';

describe(getSendFormErrorCause.name, () => {
    it.each<[string, SendFormError, SendFormErrorCause]>([
        [
            'compose failure',
            { error: 'fee-levels-compose-failed', message: 'Not enough funds.' },
            { message: 'Not enough funds.' },
        ],
        [
            'enhance failure',
            { error: 'enhance-transaction-failed', message: 'Device not found' },
            { message: 'Device not found' },
        ],
        [
            'sign failure',
            {
                error: 'sign-transaction-failed',
                errorCode: 'Device_Disconnected',
                message: 'Device disconnected',
            },
            { code: 'Device_Disconnected', message: 'Device disconnected' },
        ],
        [
            'sign timeout',
            { error: 'sign-transaction-timeout', message: 'Signing process timed out.' },
            { code: undefined, message: 'Signing process timed out.' },
        ],
        [
            'push failure',
            {
                error: 'push-transaction-failed',
                metadata: {
                    success: false,
                    error: { code: 'Backend_Error', message: 'Blockhash not found' },
                },
            },
            { code: 'Backend_Error', message: 'Blockhash not found' },
        ],
        [
            'push pending conflict',
            {
                error: 'push-transaction-pending-conflict',
                metadata: {
                    success: false,
                    error: {
                        code: 'Failure_UnknownCode',
                        message: 'could not replace existing tx',
                    },
                },
            },
            { code: 'Failure_UnknownCode', message: 'could not replace existing tx' },
        ],
    ])('keeps the code and message of a %s', (_, sendFormError, expectedCause) => {
        expect(getSendFormErrorCause(sendFormError)).toEqual(expectedCause);
    });
});
