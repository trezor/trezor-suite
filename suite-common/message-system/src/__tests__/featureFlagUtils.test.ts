import { type Feature } from '@suite-common/suite-types';

import { parseTimeoutThresholdsPerModel } from '../featureFlagUtils';
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
