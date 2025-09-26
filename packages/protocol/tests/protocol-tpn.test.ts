import { PROTOCOL_MALFORMED, PROTOCOL_MISSMATCH_VERSION, tpn } from '../src';
import {
    TrezorPushNotificationMode,
    TrezorPushNotificationType,
    Version,
} from '../src/protocol-tpn/decode';

describe('protocol-tpn', () => {
    describe('decode', () => {
        it('should correctly decode a valid Boot message in Normal Mode', () => {
            const message = [
                Version.v1,
                TrezorPushNotificationType.BOOT,
                TrezorPushNotificationMode.NormalMode,
            ];
            const result = tpn.decode(message);
            expect(result).toEqual({
                type: TrezorPushNotificationType.BOOT,
                mode: TrezorPushNotificationMode.NormalMode,
            });
        });

        it('should correctly decode a valid Lock message in Bootloader Mode', () => {
            const message = [
                Version.v1,
                TrezorPushNotificationType.LOCK,
                TrezorPushNotificationMode.BootloaderMode,
            ];
            const result = tpn.decode(message);
            expect(result).toEqual({
                type: TrezorPushNotificationType.LOCK,
                mode: TrezorPushNotificationMode.BootloaderMode,
            });
        });

        it('should throw a protocol error for messages with incorrect version', () => {
            const invalidVersionMessage = [
                99,
                TrezorPushNotificationType.BOOT,
                TrezorPushNotificationMode.BootloaderMode,
            ];

            expect(() => tpn.decode(invalidVersionMessage)).toThrow(PROTOCOL_MISSMATCH_VERSION);
        });

        it('should throw a protocol error for messages with incorrect length', () => {
            const shortMessage = [1, 0];
            const longMessage = [1, 0, 1, 99];

            expect(() => tpn.decode(shortMessage)).toThrow(PROTOCOL_MALFORMED);
            expect(() => tpn.decode(longMessage)).toThrow(PROTOCOL_MALFORMED);
        });

        it('should throw a protocol error for an unknown notification type', () => {
            const messageWithInvalidType = [Version.v1, 99, TrezorPushNotificationMode.NormalMode];

            expect(() => tpn.decode(messageWithInvalidType)).toThrow(PROTOCOL_MALFORMED);
        });

        it('should throw a protocol error for an unknown mode', () => {
            const messageWithInvalidMode = [Version.v1, TrezorPushNotificationType.BOOT, 99];
            expect(() => tpn.decode(messageWithInvalidMode)).toThrow(PROTOCOL_MALFORMED);
        });
    });
});
