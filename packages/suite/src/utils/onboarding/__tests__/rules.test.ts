/* eslint-disable @typescript-eslint/camelcase */

import {
    DISALLOWED_IS_NOT_SAME_DEVICE,
    DISALLOWED_DEVICE_IS_NOT_CONNECTED,
    DISALLOWED_DEVICE_IS_NOT_USED_HERE,
    DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
    DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
} from '@onboarding-constants/steps';

import {
    isNotSameDevice,
    isNotConnected,
    isInBootloader,
    isNotNewDevice,
    isNotUsedHere,
    getFnForRule,
} from '../rules';

const { getSuiteDevice, getDeviceFeatures } = global.JestMocks;

describe('rules', () => {
    describe('isNotConnected', () => {
        it('should return true', () => {
            expect(isNotConnected({ device: undefined })).toEqual(true);
        });
        it('should return false for device.connected === true', () => {
            expect(isNotConnected({ device: getSuiteDevice() })).toEqual(false);
        });
    });

    describe('isNotSameDevice', () => {
        const deviceWithDeviceId = getSuiteDevice({
            features: getDeviceFeatures({ device_id: '1' }),
        });
        const deviceWithDeviceId2 = getSuiteDevice({
            features: getDeviceFeatures({ device_id: '2' }),
        });
        const deviceWithoutDeviceId = getSuiteDevice({
            features: getDeviceFeatures({ device_id: null }),
        });

        it('should return false for prevDeviceId === null (no device was there before, so consider it "same" device)', () => {
            expect(
                isNotSameDevice({ device: deviceWithDeviceId, prevDevice: deviceWithoutDeviceId }),
            ).toEqual(false);
        });
        it('should return null for device.features.device_id === null', () => {
            expect(
                isNotSameDevice({ device: deviceWithoutDeviceId, prevDevice: deviceWithDeviceId }),
            ).toEqual(null);
        });
        it('should return false when device.features.device_id === prevDeviceId', () => {
            expect(
                isNotSameDevice({ device: deviceWithDeviceId, prevDevice: deviceWithDeviceId }),
            ).toEqual(false);
        });
        it('should return true when device.features.device_id !== prevDeviceId', () => {
            expect(
                isNotSameDevice({ device: deviceWithDeviceId, prevDevice: deviceWithDeviceId2 }),
            ).toEqual(true);
        });
    });

    describe('isInBootloader', () => {
        it('should return true for device.features.bootloader_mode === true', () => {
            expect(
                isInBootloader({
                    device: getSuiteDevice({
                        features: getDeviceFeatures({ bootloader_mode: true }),
                    }),
                }),
            ).toEqual(true);
        });
        it('should return false for device.features.bootloader_mode === false', () => {
            expect(
                isInBootloader({
                    device: getSuiteDevice({
                        features: getDeviceFeatures({ bootloader_mode: false }),
                    }),
                }),
            ).toEqual(false);
        });
        it('should return false for device.features.bootloader_mode === null', () => {
            expect(
                isInBootloader({
                    device: getSuiteDevice({
                        features: getDeviceFeatures({ bootloader_mode: null }),
                    }),
                }),
            ).toEqual(false);
        });
        it('cant tell without device', () => {
            expect(isInBootloader({})).toEqual(null);
        });
    });

    describe('isNotNewDevice', () => {
        it('should return false', () => {
            expect(
                isNotNewDevice({
                    device: getSuiteDevice({
                        features: getDeviceFeatures({ firmware_present: false }),
                    }),
                    path: ['new'],
                }),
            ).toEqual(false);
        });

        it('cant tell without device', () => {
            expect(isNotNewDevice({})).toEqual(null);
        });
    });

    describe('isNotUsedHere', () => {
        it('should return false', () => {
            expect(
                isNotUsedHere({
                    device: getSuiteDevice({ status: 'available', connected: true }),
                }),
            ).toEqual(false);
        });

        it('cant tell without device', () => {
            expect(isNotUsedHere({})).toEqual(null);
        });
    });

    describe('getFnForRule ', () => {
        it('should not throw for expected states', () => {
            [
                DISALLOWED_IS_NOT_SAME_DEVICE,
                DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
            ].forEach((state: string) => {
                expect(() => getFnForRule(state)).not.toThrow();
                // expect(getFnForRule(state)).not.toThrow();
            });
        });

        it('should throw for unexpected states', () => {
            ['fooo', 'bcash moon'].forEach((state: string) => {
                expect(() => getFnForRule(state)).toThrow();
                // expect(getFnForRule(state)).not.toThrow();
            });
        });
    });
});
