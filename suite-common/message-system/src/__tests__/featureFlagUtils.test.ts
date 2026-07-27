import { type Feature } from '@suite-common/suite-types';

import {
    isYieldFeatureApplicableForVault,
    parseTimeoutThresholdsPerModel,
} from '../featureFlagUtils';
import { Feature as FeatureDefinitions } from '../messageSystemTypes';

describe(parseTimeoutThresholdsPerModel.name, () => {
    it('returns empty object if feature is undefined', () => {
        expect(parseTimeoutThresholdsPerModel(undefined)).toEqual({});
    });

    it('returns empty object if feature domain is not firmwareHashCheckTimeout', () => {
        const feature: Feature = { domain: 'other-domain', flag: true };
        expect(parseTimeoutThresholdsPerModel(feature)).toEqual({});
    });

    it('returns empty object if timeoutThresholdsPerModel is not an indexable object', () => {
        const feature: Feature = {
            domain: FeatureDefinitions.firmwareHashCheckTimeout,
            flag: true,
            timeoutThresholdsPerModel: null,
        };
        expect(parseTimeoutThresholdsPerModel(feature)).toEqual({});
    });

    it('returns the override object if valid (indexable object)', () => {
        const override = { T1B1: 1111, T2T1: 2222 };
        const feature: Feature = {
            domain: FeatureDefinitions.firmwareHashCheckTimeout,
            flag: true,
            timeoutThresholdsPerModel: override,
        };
        expect(parseTimeoutThresholdsPerModel(feature)).toBe(override);
    });
});

describe(isYieldFeatureApplicableForVault.name, () => {
    const targetedFeature: Feature = {
        domain: FeatureDefinitions.earn.yield.deposit,
        flag: false,
        payload: {
            vaultContractAddresses: ['0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829'],
        },
    };

    it.each([
        [
            'global feature without payload',
            { domain: FeatureDefinitions.earn.yield.deposit, flag: false },
            undefined,
            true,
        ],
        [
            'targeted matching vault address',
            targetedFeature,
            '0xE4dB1c5A1B709Ce4d2aDA6985d9D506E58f73829',
            true,
        ],
        [
            'targeted non-matching vault address',
            targetedFeature,
            '0xde6c23e561f3e55846207ec45a91b777e0f7c889',
            false,
        ],
        [
            'invalid targeted payload',
            {
                domain: FeatureDefinitions.earn.yield.deposit,
                flag: false,
                payload: { vaultContractAddresses: [] },
            },
            '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829',
            false,
        ],
    ] as const satisfies [string, Feature, string | undefined, boolean][])(
        'returns %s result',
        (_description, feature, vaultContractAddress, expected) => {
            expect(isYieldFeatureApplicableForVault({ feature, vaultContractAddress })).toBe(
                expected,
            );
        },
    );
});
