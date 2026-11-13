import { type CountryCode, isKnownCountryCode } from '@suite-common/geolocation';
import { type Feature } from '@suite-common/suite-types';
import { type FirmwareHashCheckTimeouts } from '@trezor/connect';

import { Feature as FeatureDefinitions } from './messageSystemTypes';

export const parseTimeoutThresholdsPerModel = (
    feature: Feature | undefined,
): Partial<FirmwareHashCheckTimeouts> => {
    if (feature?.domain !== FeatureDefinitions.firmwareHashCheckTimeout) {
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

const getPayloadCountries = (payload: Feature['payload'], key: string): CountryCode[] => {
    const payloadCountries = payload?.[key];

    if (!Array.isArray(payloadCountries)) {
        return [];
    }

    return payloadCountries
        .filter((code): code is string => typeof code === 'string')
        .map(code => code.toUpperCase())
        .filter(isKnownCountryCode);
};

export const getTradingResidenceWhitelist = (feature: Feature | undefined): CountryCode[] =>
    getPayloadCountries(feature?.payload, 'allowedCountries');

export const getRegionRestrictedCountries = (feature: Feature | undefined): CountryCode[] =>
    getPayloadCountries(feature?.payload, 'countries');

export type RegionRestrictionThresholds = { strong: number; weak: number };

export const DEFAULT_REGION_RESTRICTION_THRESHOLDS: Readonly<RegionRestrictionThresholds> = {
    strong: 0.5,
    weak: 0.35,
};

const isThreshold = (value: unknown): value is number =>
    typeof value === 'number' && value > 0 && value < 1;

export const getRegionRestrictionThresholds = (
    feature: Feature | undefined,
): RegionRestrictionThresholds => {
    const thresholds = feature?.payload?.thresholds;

    if (typeof thresholds !== 'object' || thresholds === null || Array.isArray(thresholds)) {
        return { ...DEFAULT_REGION_RESTRICTION_THRESHOLDS };
    }

    return {
        strong:
            'strong' in thresholds && isThreshold(thresholds.strong)
                ? thresholds.strong
                : DEFAULT_REGION_RESTRICTION_THRESHOLDS.strong,
        weak:
            'weak' in thresholds && isThreshold(thresholds.weak)
                ? thresholds.weak
                : DEFAULT_REGION_RESTRICTION_THRESHOLDS.weak,
    };
};

type IsYieldFeatureApplicableForVaultParams = {
    feature: Feature;
    vaultContractAddress?: string | null;
};

export const isYieldFeatureApplicableForVault = ({
    feature,
    vaultContractAddress,
}: IsYieldFeatureApplicableForVaultParams) => {
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
