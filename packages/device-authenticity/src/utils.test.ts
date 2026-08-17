import { deviceAuthenticityConfig } from './config/deviceAuthenticityConfig';
import { getRootPubKeys } from './utils';

describe(getRootPubKeys.name, () => {
    it('returns Optiga production keys for T2B1 by default', () => {
        expect(
            getRootPubKeys({
                proofType: 'optiga',
                config: deviceAuthenticityConfig,
                deviceModel: 'T2B1',
            }),
        ).toEqual(deviceAuthenticityConfig.T2B1.rootPubKeysOptiga);
    });

    it('returns Optiga production and debug keys for T2B1 when debug keys are allowed', () => {
        expect(
            getRootPubKeys({
                proofType: 'optiga',
                config: deviceAuthenticityConfig,
                deviceModel: 'T2B1',
                allowDebugKeys: true,
            }),
        ).toEqual([
            ...deviceAuthenticityConfig.T2B1.rootPubKeysOptiga,
            ...deviceAuthenticityConfig.T2B1.debug!.rootPubKeysOptiga,
        ]);
    });

    it('returns Tropic production keys for T3W1 by default', () => {
        expect(
            getRootPubKeys({
                proofType: 'tropic',
                config: deviceAuthenticityConfig,
                deviceModel: 'T3W1',
            }),
        ).toEqual(deviceAuthenticityConfig.T3W1.rootPubKeysTropic);
    });

    it('returns Tropic production and debug keys for T3W1 when debug keys are allowed', () => {
        expect(
            getRootPubKeys({
                proofType: 'tropic',
                config: deviceAuthenticityConfig,
                deviceModel: 'T3W1',
                allowDebugKeys: true,
            }),
        ).toEqual([
            ...deviceAuthenticityConfig.T3W1.rootPubKeysTropic!,
            ...deviceAuthenticityConfig.T3W1.debug!.rootPubKeysTropic!,
        ]);
    });

    it('returns MCU production keys for T3W1 by default', () => {
        expect(
            getRootPubKeys({
                proofType: 'mcu',
                config: deviceAuthenticityConfig,
                deviceModel: 'T3W1',
            }),
        ).toEqual(deviceAuthenticityConfig.T3W1.rootPubKeysMLDSA);
    });

    it('returns MCU production and debug keys for T3W1 when debug keys are allowed', () => {
        expect(
            getRootPubKeys({
                proofType: 'mcu',
                config: deviceAuthenticityConfig,
                deviceModel: 'T3W1',
                allowDebugKeys: true,
            }),
        ).toEqual([
            ...deviceAuthenticityConfig.T3W1.rootPubKeysMLDSA!,
            ...deviceAuthenticityConfig.T3W1.debug!.rootPubKeysMLDSA!,
        ]);
    });

    it('throws for a device model missing in config', () => {
        expect(() =>
            getRootPubKeys({
                proofType: 'optiga',
                config: deviceAuthenticityConfig,
                deviceModel: 'UNKNOWN',
            }),
        ).toThrow('Pubkeys for UNKNOWN not found in config');
    });
});
