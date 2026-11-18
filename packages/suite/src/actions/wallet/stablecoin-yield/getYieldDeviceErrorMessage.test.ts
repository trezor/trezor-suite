import { getYieldDeviceErrorMessage } from './signingHelpers';

describe('getYieldDeviceErrorMessage', () => {
    it.each([
        ['an incorrect passphrase', 'Device_InvalidState', 'Passphrase is incorrect'],
        ['a closed passphrase prompt', 'Method_Interrupted', 'Passphrase is incorrect'],
        ['a disconnect reported by Connect', 'Device_Disconnected', 'Device disconnected'],
    ])('recognizes %s by its code', (_, code, message) => {
        expect(getYieldDeviceErrorMessage(new Error('failure', { cause: code }))).toBe(message);
    });

    it('recognizes a disconnect reported by the transport', () => {
        const error = new Error('Failure_UnknownCode: device disconnected during action', {
            cause: 'Failure_UnknownCode',
        });

        expect(getYieldDeviceErrorMessage(error)).toBe('Device disconnected');
    });

    it('leaves other errors to the form', () => {
        expect(getYieldDeviceErrorMessage(new Error('boom'))).toBeUndefined();
        expect(getYieldDeviceErrorMessage('boom')).toBeUndefined();
    });
});
