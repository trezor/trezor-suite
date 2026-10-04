import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import { evaluateDeviceFeatures } from './deviceFeatures';

const mockFeatures = (overrides: Partial<PROTO.Features> = {}): PROTO.Features => ({
    vendor: 'bitcointrezor.com',
    major_version: 1,
    minor_version: 6,
    patch_version: 3,
    device_id: null,
    model: '1',
    capabilities: [],
    internal_model: 'T1B1' as PROTO.Features['internal_model'],
    initialized: true,
    pin_protection: true,
    passphrase_protection: false,
    ...overrides,
});

describe('evaluateDeviceFeatures', () => {
    it.each([
        [1, 3, 6],
        [1, 4, 2],
        [1, 5, 1],
        [1, 6, 0],
        [1, 6, 3],
    ])('accepts an initialized Trezor One with firmware %i.%i.%i', (major, minor, patch) => {
        expect(
            evaluateDeviceFeatures(
                mockFeatures({ major_version: major, minor_version: minor, patch_version: patch }),
            ),
        ).toEqual({
            success: true,
            payload: {
                firmwareVersion: [major, minor, patch],
                hasPinProtection: true,
                hasPassphraseProtection: false,
            },
        });
    });

    it('reports passphrase protection', () => {
        expect(
            evaluateDeviceFeatures(
                mockFeatures({ passphrase_protection: true, pin_protection: false }),
            ),
        ).toMatchObject({
            payload: { hasPinProtection: false, hasPassphraseProtection: true },
        });
    });

    it.each([
        [1, 3, 5, 'firmware-too-old'],
        [1, 2, 9, 'firmware-too-old'],
        [1, 6, 4, 'firmware-too-new'],
        [1, 7, 0, 'firmware-too-new'],
        [1, 12, 1, 'firmware-too-new'],
    ])('refuses firmware %i.%i.%i as %s', (major, minor, patch, type) => {
        expect(
            evaluateDeviceFeatures(
                mockFeatures({ major_version: major, minor_version: minor, patch_version: patch }),
            ),
        ).toEqual({ success: false, error: { type, firmwareVersion: [major, minor, patch] } });
    });

    it('refuses a device in bootloader mode whatever version it reports', () => {
        expect(evaluateDeviceFeatures(mockFeatures({ bootloader_mode: true }))).toEqual({
            success: false,
            error: { type: 'bootloader-mode' },
        });
    });

    it('refuses a device that is not a Trezor One', () => {
        expect(evaluateDeviceFeatures(mockFeatures({ major_version: 2 }))).toEqual({
            success: false,
            error: { type: 'not-trezor-one' },
        });
    });

    it.each([false, null, undefined])('refuses a device with initialized = %s', initialized => {
        expect(evaluateDeviceFeatures(mockFeatures({ initialized }))).toEqual({
            success: false,
            error: { type: 'not-initialized' },
        });
    });
});
