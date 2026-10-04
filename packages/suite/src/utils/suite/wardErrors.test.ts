import { type ERRORS } from '@trezor/connect';

import { type WardErrorCode, getWardErrorFromConnect } from './wardErrors';

describe('getWardErrorFromConnect', () => {
    it('keeps the wardd code that wardRelay puts in the message', () => {
        const message = 'wardd device_failure: the device refused';

        expect(getWardErrorFromConnect({ code: 'Runtime', message })).toEqual({
            code: 'device_failure',
            detail: message,
        });
    });

    it.each<[ERRORS.ErrorCode, string, WardErrorCode]>([
        ['Failure_ActionCancelled', 'Action cancelled by user', 'cancelled'],
        ['Failure_PinCancelled', 'PIN entry cancelled', 'cancelled'],
        ['Method_Cancel', 'Canceled', 'cancelled'],
        ['Failure_UnknownCode', 'Passphrase request cancelled', 'cancelled'],
        ['Device_NotFound', 'Device not found', 'no_device'],
        ['Device_Disconnected', 'Device disconnected', 'no_device'],
        ['Failure_DataError', 'Invalid entry', 'device_failure'],
        ['Failure_ProcessError', 'WARD queue is full', 'device_failure'],
        ['Failure_UnknownCode', 'no WebSocket implementation available to reach wardd', 'internal'],
        ['Method_InvalidParameter', 'Parameter "url" has invalid type', 'internal'],
        ['Device_CallInProgress', 'Device call in progress', 'internal'],
    ])('maps %s "%s" to %s', (code, message, wardErrorCode) => {
        expect(getWardErrorFromConnect({ code, message })).toEqual({
            code: wardErrorCode,
            detail: message,
        });
    });
});
