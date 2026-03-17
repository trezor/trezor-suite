import { type Feature } from '@suite-common/suite-types';
import { type FirmwareHashCheckTimeouts } from '@trezor/connect';

import { Feature as FeatureDefinitions } from './messageSystemTypes';

export const parseTimeoutThresholdsPerModel = (
    feature: Feature | undefined,
): Partial<FirmwareHashCheckTimeouts> => {
    if (feature === undefined || feature.domain !== FeatureDefinitions.firmwareHashCheckTimeout) {
        return {};
    }

    const override = feature.timeoutThresholdsPerModel;
    // non-exhaustive Record is expected, so all we need to validate is that it's an indexable object.
    if (typeof override !== 'object' || override === null) return {};

    return override;
};
