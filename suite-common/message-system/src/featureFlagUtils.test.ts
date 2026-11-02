import fs from 'fs';

import { type Feature, type MessageSystem } from '@suite-common/suite-types';

import {
    getFinpromRestrictedCountries,
    getTradingResidenceWhitelist,
    isYieldFeatureApplicableForVault,
    parseTimeoutThresholdsPerModel,
} from './featureFlagUtils';
import { Feature as FeatureDefinitions } from './messageSystemTypes';
import { CONFIG_PATH } from '../scripts/constants';

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

describe('getTradingResidenceWhitelist', () => {
    const residenceFeature = (payload?: Feature['payload']): Feature => ({
        domain: FeatureDefinitions.trading.restrictions.residenceWhitelistRequired,
        flag: true,
        payload,
    });

    it.each([
        ['undefined feature', undefined, []],
        ['feature without payload', residenceFeature(), []],
        ['allowedCountries not an array', residenceFeature({ allowedCountries: 'CZ' }), []],
        ['empty allowedCountries', residenceFeature({ allowedCountries: [] }), []],
        [
            'mixed countries',
            residenceFeature({ allowedCountries: ['CZ', 'ZZ', 1, null, 'US'] }),
            ['CZ', 'US'],
        ],
        [
            'differently cased countries',
            residenceFeature({ allowedCountries: ['cz', 'Us', 'sK', 'zz'] }),
            ['CZ', 'US', 'SK'],
        ],
    ] as const satisfies [string, Feature | undefined, readonly string[]][])(
        'returns countries for %s',
        (_description, feature, expected) => {
            expect(getTradingResidenceWhitelist(feature)).toEqual(expected);
        },
    );

    it('accepts every country of the bundled config residence feature', () => {
        const config: MessageSystem = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        const residenceFeatures = config.actions
            .flatMap(action => action.message.feature ?? [])
            .filter(
                feature =>
                    feature.domain ===
                    FeatureDefinitions.trading.restrictions.residenceWhitelistRequired,
            );

        residenceFeatures.forEach(feature => {
            expect(getTradingResidenceWhitelist(feature)).toEqual(
                feature.payload?.allowedCountries,
            );
        });
    });
});

describe(getFinpromRestrictedCountries.name, () => {
    const finpromFeature = (payload?: Feature['payload']): Feature => ({
        domain: FeatureDefinitions.finprom.presenceRestriction,
        flag: true,
        payload,
    });

    it.each([
        ['undefined feature', undefined, []],
        ['feature without payload', finpromFeature(), []],
        ['countries not an array', finpromFeature({ countries: 'GB' }), []],
        ['countries under the residence key', finpromFeature({ allowedCountries: ['GB'] }), []],
        [
            'non-string entries',
            finpromFeature({ countries: ['GB', 1, null, {}, 'CZ'] }),
            ['GB', 'CZ'],
        ],
        ['differently cased countries', finpromFeature({ countries: ['gb', 'Cz'] }), ['GB', 'CZ']],
        [
            'unknown and special codes',
            finpromFeature({ countries: ['GB', 'ZZ', 'T1', 'XX', 'GBR', ''] }),
            ['GB'],
        ],
    ] as const satisfies [string, Feature | undefined, readonly string[]][])(
        'returns countries for %s',
        (_description, feature, expected) => {
            expect(getFinpromRestrictedCountries(feature)).toEqual(expected);
        },
    );
});
