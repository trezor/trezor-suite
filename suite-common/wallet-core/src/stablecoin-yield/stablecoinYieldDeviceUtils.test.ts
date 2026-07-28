import { type TrezorDevice } from '@suite-common/suite-types';
import { testMocks } from '@suite-common/test-utils';
import { type Features } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { isStablecoinYieldSupported } from './stablecoinYieldDeviceUtils';

const createDevice = (features: Partial<Features>): TrezorDevice =>
    ({
        features: testMocks.getDeviceFeatures(features),
    }) as unknown as TrezorDevice;

const createDeviceWithFirmware = ([major, minor, patch]: [number, number, number]): TrezorDevice =>
    createDevice({ major_version: major, minor_version: minor, patch_version: patch });

describe('isStablecoinYieldSupported', () => {
    it('returns false when no device is selected', () => {
        expect(isStablecoinYieldSupported(undefined, 'deposit')).toBe(false);
    });

    it('returns false when device has no features', () => {
        const deviceWithoutFeatures = {} as unknown as TrezorDevice;

        expect(isStablecoinYieldSupported(deviceWithoutFeatures, 'deposit')).toBe(false);
    });

    it('returns true for T1B1 regardless of firmware version', () => {
        const device = createDevice({
            internal_model: DeviceModelInternal.T1B1,
            major_version: 1,
            minor_version: 10,
            patch_version: 0,
        });

        expect(isStablecoinYieldSupported(device, 'deposit')).toBe(true);
        expect(isStablecoinYieldSupported(device, 'withdraw')).toBe(true);
        expect(isStablecoinYieldSupported(device, 'claim')).toBe(true);
    });

    it.each(['deposit', 'withdraw'] as const)('requires firmware 2.12.0 for %s', flowType => {
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 11, 9]), flowType)).toBe(
            false,
        );
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]), flowType)).toBe(
            true,
        );
    });

    it('requires firmware 2.12.0 when no flow type is given', () => {
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 11, 9]))).toBe(false);
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]))).toBe(true);
    });

    it('requires firmware 2.12.1 for claim', () => {
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]), 'claim')).toBe(
            false,
        );
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 1]), 'claim')).toBe(
            true,
        );
    });
});
