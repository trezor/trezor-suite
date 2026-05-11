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

const getYieldVaultContractAddresses = (payload: Feature['payload']) => {
    if (!Array.isArray(payload?.vaultContractAddresses)) {
        return [];
    }

    return payload.vaultContractAddresses
        .filter((address): address is string => typeof address === 'string' && address !== '')
        .map(address => address.toLowerCase());
};

export const isYieldFeatureApplicableForVault = ({
    feature,
    vaultContractAddress,
}: {
    feature: Feature;
    vaultContractAddress?: string | null;
}) => {
    if (feature.payload === undefined) {
        return true;
    }

    if (!vaultContractAddress) {
        return false;
    }

    return getYieldVaultContractAddresses(feature.payload).includes(
        vaultContractAddress.toLowerCase(),
    );
};
