/* eslint-disable @typescript-eslint/camelcase */

import {
    isNotSameDevice,
    isNotConnected,
    isInBootloader,
    isRequestingPin,
    isNotNewDevice,
} from '../rules';

describe('rules.js', () => {
    describe('isNotConneted', () => {
        it('should return true for device.connected === false', () => {
            expect(isNotConnected({ device: { connected: false } })).toEqual(true);
        });
        it('should return false for device.connected === true', () => {
            expect(isNotConnected({ device: { connected: true } })).toEqual(false);
        });
    });

    describe('isNotSameDevice', () => {
        const device_id = '028FFD8215822B61ACB55D7D';
        const deviceWithDeviceId = { features: { device_id } };
        const deviceWithoutDeviceId: any = { features: { device_id: null } };

        it('should return null for prevDeviceId === null', () => {
            expect(isNotSameDevice({ device: deviceWithDeviceId, prevDeviceId: null })).toEqual(
                null,
            );
        });
        it('should return null for device.features.device_id === null', () => {
            expect(
                isNotSameDevice({ device: deviceWithoutDeviceId, prevDeviceId: device_id }),
            ).toEqual(null);
        });
        it('should return false when device.features.device_id === prevDeviceId', () => {
            expect(
                isNotSameDevice({ device: deviceWithDeviceId, prevDeviceId: device_id }),
            ).toEqual(false);
        });
        it('should return true when device.features.device_id !== prevDeviceId', () => {
            expect(isNotSameDevice({ device: deviceWithDeviceId, prevDeviceId: 'foo' })).toEqual(
                true,
            );
        });
    });

    describe('isInBootloader', () => {
        it('should return true for device.features.bootloader_mode === true', () => {
            expect(isInBootloader({ device: { features: { bootloader_mode: true } } })).toEqual(
                true,
            );
        });
        it('should return false for device.features.bootloader_mode === false', () => {
            expect(isInBootloader({ device: { features: { bootloader_mode: false } } })).toEqual(
                false,
            );
        });
        it('should return false for device.features.bootloader_mode === null', () => {
            expect(isInBootloader({ device: { features: { bootloader_mode: null } } })).toEqual(
                false,
            );
        });
    });

    describe('isRequestingPin', () => {
        it('should return true', () => {
            expect(
                isRequestingPin({
                    device: { isRequestingPin: 1 },
                }),
            ).toEqual(true);
        });
    });

    describe('isNotNewDevice', () => {
        it('should return false', () => {
            expect(
                isNotNewDevice({
                    device: { features: { firmware_present: false } },
                    asNewDevice: true,
                }),
            ).toEqual(false);
        });

        it('cant tell without device', () => {
            expect(
                isNotNewDevice({
                    asNewDevice: true,
                }),
            ).toEqual(null);
        });
    });
});
