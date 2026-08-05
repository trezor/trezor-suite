import { type TrezorDevice } from '@suite-common/suite-types';
import { testMocks } from '@suite-common/test-utils';
import { type Features } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    isStablecoinYieldSupported,
    isWrappedNativeFlowSupported,
} from './stablecoinYieldDeviceUtils';

const createDevice = (features: Partial<Features>): TrezorDevice =>
    ({
        features: testMocks.getDeviceFeatures(features),
    }) as unknown as TrezorDevice;

const createDeviceWithFirmware = ([major, minor, patch]: [number, number, number]): TrezorDevice =>
    createDevice({ major_version: major, minor_version: minor, patch_version: patch });

const wethVaultToken = {
    networkSymbol: 'eth',
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
} as const;

const usdcVaultToken = {
    networkSymbol: 'eth',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
} as const;

describe('isStablecoinYieldSupported', () => {
    it('returns false when no device is selected', () => {
        expect(isStablecoinYieldSupported(undefined, { flowType: 'deposit' })).toBe(false);
    });

    it('returns false when device has no features', () => {
        const deviceWithoutFeatures = {} as unknown as TrezorDevice;

        expect(isStablecoinYieldSupported(deviceWithoutFeatures, { flowType: 'deposit' })).toBe(
            false,
        );
    });

    it('returns true for T1B1 regardless of firmware version', () => {
        const device = createDevice({
            internal_model: DeviceModelInternal.T1B1,
            major_version: 1,
            minor_version: 10,
            patch_version: 0,
        });

        expect(isStablecoinYieldSupported(device, { flowType: 'deposit' })).toBe(true);
        expect(isStablecoinYieldSupported(device, { flowType: 'withdraw' })).toBe(true);
        expect(isStablecoinYieldSupported(device, { flowType: 'claim' })).toBe(true);
        expect(
            isStablecoinYieldSupported(device, { flowType: 'deposit', vaultToken: wethVaultToken }),
        ).toBe(true);
    });

    it.each(['deposit', 'withdraw'] as const)('requires firmware 2.12.0 for %s', flowType => {
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 11, 9]), { flowType })).toBe(
            false,
        );
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]), { flowType })).toBe(
            true,
        );
    });

    it('requires firmware 2.12.0 when no flow type is given', () => {
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 11, 9]))).toBe(false);
        expect(isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]))).toBe(true);
    });

    it('requires firmware 2.12.1 for claim', () => {
        expect(
            isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]), { flowType: 'claim' }),
        ).toBe(false);
        expect(
            isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 1]), { flowType: 'claim' }),
        ).toBe(true);
    });

    it.each(['deposit', 'withdraw', 'redeem'] as const)(
        'requires firmware 2.12.4 for %s into a wrapped-native vault',
        flowType => {
            expect(
                isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 3]), {
                    flowType,
                    vaultToken: wethVaultToken,
                }),
            ).toBe(false);
            expect(
                isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 4]), {
                    flowType,
                    vaultToken: wethVaultToken,
                }),
            ).toBe(true);
        },
    );

    it('requires firmware 2.12.4 for a wrapped-native vault when no flow type is given', () => {
        expect(
            isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 3]), {
                vaultToken: wethVaultToken,
            }),
        ).toBe(false);
        expect(
            isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 4]), {
                vaultToken: wethVaultToken,
            }),
        ).toBe(true);
    });

    it('keeps the 2.12.0 requirement for vaults with a non-wrapped-native input token', () => {
        expect(
            isStablecoinYieldSupported(createDeviceWithFirmware([2, 12, 0]), {
                flowType: 'deposit',
                vaultToken: usdcVaultToken,
            }),
        ).toBe(true);
    });
});

describe('isWrappedNativeFlowSupported', () => {
    it('returns false when no device is selected', () => {
        expect(isWrappedNativeFlowSupported(undefined)).toBe(false);
    });

    it('requires firmware 2.12.4', () => {
        expect(isWrappedNativeFlowSupported(createDeviceWithFirmware([2, 12, 3]))).toBe(false);
        expect(isWrappedNativeFlowSupported(createDeviceWithFirmware([2, 12, 4]))).toBe(true);
    });

    it('returns true for T1B1 regardless of firmware version', () => {
        const device = createDevice({
            internal_model: DeviceModelInternal.T1B1,
            major_version: 1,
            minor_version: 10,
            patch_version: 0,
        });

        expect(isWrappedNativeFlowSupported(device)).toBe(true);
    });
});
