import { PROTOCOL_MALFORMED, PROTOCOL_MISSMATCH_VERSION, tpn } from '../index';
import { TrezorPushNotificationMode, TrezorPushNotificationType, Version } from './decode';

describe('protocol-tpn', () => {
    describe('decode', () => {
        it('should correctly decode a valid Boot message in Normal Mode', () => {
            const message = [
                Version.v1,
                TrezorPushNotificationType.BOOT,
                TrezorPushNotificationMode.NormalMode,
            ];
            expect(tpn.decode(message)).toEqual({
                success: true,
                payload: {
                    type: TrezorPushNotificationType.BOOT,
                    mode: TrezorPushNotificationMode.NormalMode,
                },
            });
        });

        it('should correctly decode a valid Lock message in Bootloader Mode', () => {
            const message = [
                Version.v1,
                TrezorPushNotificationType.LOCK,
                TrezorPushNotificationMode.BootloaderMode,
            ];
            expect(tpn.decode(message)).toEqual({
                success: true,
                payload: {
                    type: TrezorPushNotificationType.LOCK,
                    mode: TrezorPushNotificationMode.BootloaderMode,
                },
            });
        });

        it('should return a protocol error for messages with incorrect version', () => {
            const invalidVersionMessage = [
                99,
                TrezorPushNotificationType.BOOT,
                TrezorPushNotificationMode.BootloaderMode,
            ];
            expect(tpn.decode(invalidVersionMessage)).toEqual({
                success: false,
                error: PROTOCOL_MISSMATCH_VERSION,
            });
        });

        it('should correctly decode longer message but return a protocol error for shorter message', () => {
            const shortMessage = [1, 0];
            const longMessage = [1, 0, 1, 99];

            expect(tpn.decode(shortMessage)).toEqual({ success: false, error: PROTOCOL_MALFORMED });
            expect(tpn.decode(longMessage)).toEqual({
                success: true,
                payload: {
                    type: TrezorPushNotificationType.BOOT,
                    mode: TrezorPushNotificationMode.BootloaderMode,
                },
            });
        });

        it('should return a protocol error for an unknown notification type', () => {
            const messageWithInvalidType = [Version.v1, 99, TrezorPushNotificationMode.NormalMode];

            expect(tpn.decode(messageWithInvalidType)).toEqual({
                success: false,
                error: PROTOCOL_MALFORMED,
            });
        });

        it('should return a protocol error for an unknown mode', () => {
            const messageWithInvalidMode = [Version.v1, TrezorPushNotificationType.BOOT, 99];
            expect(tpn.decode(messageWithInvalidMode)).toEqual({
                success: false,
                error: PROTOCOL_MALFORMED,
            });
        });
    });
});
