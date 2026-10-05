import { getContactsErrorFromConnect, isFirmwareUnsupportedError } from './contactsErrors';

describe('isFirmwareUnsupportedError', () => {
    it('detects the Connect rejection of a method this firmware does not support', () => {
        expect(
            isFirmwareUnsupportedError({
                code: 'Device_FwException',
                message: 'ui-device_firmware_unsupported',
            }),
        ).toBe(true);
        expect(
            isFirmwareUnsupportedError({
                code: 'Device_FwException',
                message: 'ui-device_firmware_old',
            }),
        ).toBe(true);
    });

    it('detects firmware without a Nostr handler', () => {
        expect(
            isFirmwareUnsupportedError({
                code: 'Failure_UnexpectedMessage',
                message: 'Unexpected message',
            }),
        ).toBe(true);
    });

    it('falls back to the message when there is no code', () => {
        expect(isFirmwareUnsupportedError({ message: 'Unexpected message' })).toBe(true);
        expect(isFirmwareUnsupportedError({ message: 'ui-device_firmware_unsupported' })).toBe(
            true,
        );
    });

    it('does not take other errors for missing firmware support', () => {
        expect(isFirmwareUnsupportedError(undefined)).toBe(false);
        expect(
            isFirmwareUnsupportedError({ code: 'Failure_ActionCancelled', message: 'Cancelled' }),
        ).toBe(false);
        expect(
            isFirmwareUnsupportedError({
                code: 'Device_Disconnected',
                message: 'Device disconnected',
            }),
        ).toBe(false);
    });
});

describe('getContactsErrorFromConnect', () => {
    it('maps missing Nostr support', () => {
        expect(
            getContactsErrorFromConnect({
                code: 'Device_FwException',
                message: 'ui-device_firmware_unsupported',
            }),
        ).toEqual({ code: 'firmware_unsupported', detail: 'ui-device_firmware_unsupported' });
    });

    it('maps other failures like a WARD device call', () => {
        expect(
            getContactsErrorFromConnect({ code: 'Failure_ActionCancelled', message: 'Cancelled' }),
        ).toEqual({ code: 'cancelled', detail: 'Cancelled' });
        expect(getContactsErrorFromConnect({ code: 'Failure_DataError', message: 'Bad' })).toEqual({
            code: 'device_failure',
            detail: 'Bad',
        });
        expect(
            getContactsErrorFromConnect({ code: 'Method_InvalidParameter', message: 'Bad path' }),
        ).toEqual({ code: 'internal', detail: 'Bad path' });
    });
});
