import { type CountryCode, isKnownCountryCode } from '../countries';
import { getTimeZoneCountry } from './getTimeZoneCountry';
import {
    type DevicePresenceSignals,
    type PresenceEstimate,
    type PresenceSignals,
} from './presenceTypes';

type Outcome = 'match' | 'mismatch';
type Resolved = Outcome | 'missing';

type RegionResolution = { outcome: Outcome | undefined; isFromSecondaryRegions: boolean };

type TimeZoneKey = `timeZone${Capitalize<Resolved>}`;
type RegionKey = `region${Capitalize<Resolved>}`;

const TIME_ZONE_KEYS: Record<Resolved, TimeZoneKey> = {
    match: 'timeZoneMatch',
    mismatch: 'timeZoneMismatch',
    missing: 'timeZoneMissing',
};

const REGION_KEYS: Record<Resolved, RegionKey> = {
    match: 'regionMatch',
    mismatch: 'regionMismatch',
    missing: 'regionMissing',
};

const ESTIMATE_BY_TIME_ZONE_AND_REGION: Record<TimeZoneKey, Record<RegionKey, PresenceEstimate>> = {
    timeZoneMatch: {
        regionMatch: { score: 0.99, evidence: 'strong' },
        regionMismatch: { score: 0.75, evidence: 'weak' },
        regionMissing: { score: 0.95, evidence: 'weak' },
    },
    timeZoneMismatch: {
        regionMatch: { score: 0.45, evidence: 'weak' },
        regionMismatch: { score: 0.01, evidence: 'strong' },
        regionMissing: { score: 0.1, evidence: 'weak' },
    },
    timeZoneMissing: {
        regionMatch: { score: 0.8, evidence: 'weak' },
        regionMismatch: { score: 0.15, evidence: 'weak' },
        regionMissing: { score: 0.5, evidence: 'none' },
    },
};

const IP_LIKELIHOOD_RATIO: Record<Outcome, number> = { match: 99, mismatch: 0.01 };

const matchCountry = (
    countries: readonly CountryCode[],
    code: string | null | undefined,
): Outcome | undefined => {
    const normalized = code?.trim().toUpperCase();

    if (!normalized || !isKnownCountryCode(normalized)) {
        return undefined;
    }

    return countries.includes(normalized) ? 'match' : 'mismatch';
};

const resolveSecondaryRegions = (
    countries: readonly CountryCode[],
    secondaryRegions: readonly string[],
): Outcome | undefined => {
    const outcomes = secondaryRegions.map(region => matchCountry(countries, region));

    if (outcomes.includes('match')) {
        return 'match';
    }

    if (outcomes.includes('mismatch')) {
        return 'mismatch';
    }

    return undefined;
};

const resolveRegion = (
    countries: readonly CountryCode[],
    { primaryRegion, secondaryRegions }: DevicePresenceSignals,
): RegionResolution => {
    const primary = matchCountry(countries, primaryRegion);

    if (primary) {
        return { outcome: primary, isFromSecondaryRegions: false };
    }

    const secondary = resolveSecondaryRegions(countries, secondaryRegions);

    return { outcome: secondary, isFromSecondaryRegions: secondary !== undefined };
};

const getDeviceSignalsEstimate = (
    timeZone: Outcome | undefined,
    { outcome, isFromSecondaryRegions }: RegionResolution,
): PresenceEstimate => {
    const timeZoneKey = TIME_ZONE_KEYS[timeZone ?? 'missing'];
    const regionKey = REGION_KEYS[outcome ?? 'missing'];
    const deviceEstimate = ESTIMATE_BY_TIME_ZONE_AND_REGION[timeZoneKey][regionKey];

    if (isFromSecondaryRegions && deviceEstimate.evidence === 'strong') {
        return { ...deviceEstimate, evidence: 'weak' };
    }

    return { ...deviceEstimate };
};

export const applyLikelihoodRatio = (score: number, likelihoodRatio: number) =>
    (score * likelihoodRatio) / (score * likelihoodRatio + (1 - score));

const isDisagreement = (ip: Outcome, other: Outcome | undefined) =>
    other !== undefined && other !== ip;

const resolveDeviceSignals = (
    countries: readonly CountryCode[],
    signals: DevicePresenceSignals,
) => {
    const timeZone = matchCountry(countries, getTimeZoneCountry(signals.timeZone));
    const region = resolveRegion(countries, signals);

    return { timeZone, region, deviceEstimate: getDeviceSignalsEstimate(timeZone, region) };
};

export const estimatePresence = (
    countries: readonly CountryCode[],
    { ipCountry, ...deviceSignals }: PresenceSignals,
): PresenceEstimate => {
    const { timeZone, region, deviceEstimate } = resolveDeviceSignals(countries, deviceSignals);
    const ip = matchCountry(countries, ipCountry);

    if (!ip) {
        return deviceEstimate;
    }

    const isWeak = isDisagreement(ip, timeZone) || isDisagreement(ip, region.outcome);

    return {
        score: applyLikelihoodRatio(deviceEstimate.score, IP_LIKELIHOOD_RATIO[ip]),
        evidence: isWeak ? 'weak' : 'strong',
    };
};
