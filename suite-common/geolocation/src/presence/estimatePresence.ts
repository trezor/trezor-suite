import { type CountryCode, isKnownCountryCode } from '../countries';
import {
    type DevicePresenceSignals,
    type PresenceEstimate,
    type PresenceSignals,
} from './presenceTypes';
import { timezoneCountries } from './timezoneCountries';

type Outcome = 'match' | 'mismatch';
type Resolved = Outcome | 'missing';

type RegionResolution = { outcome: Outcome | undefined; capped: boolean };

const CELLS: Record<Resolved, Record<Resolved, PresenceEstimate>> = {
    match: {
        match: { score: 0.99, evidence: 'strong' },
        mismatch: { score: 0.75, evidence: 'weak' },
        missing: { score: 0.95, evidence: 'weak' },
    },
    mismatch: {
        match: { score: 0.45, evidence: 'weak' },
        mismatch: { score: 0.01, evidence: 'strong' },
        missing: { score: 0.1, evidence: 'weak' },
    },
    missing: {
        match: { score: 0.8, evidence: 'weak' },
        mismatch: { score: 0.15, evidence: 'weak' },
        missing: { score: 0.5, evidence: 'none' },
    },
};

const IP_LR: Record<Outcome, number> = { match: 99, mismatch: 0.01 };

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

const getTimeZoneCountry = (timeZone: string | null) =>
    timeZone !== null && Object.hasOwn(timezoneCountries, timeZone)
        ? timezoneCountries[timeZone]
        : undefined;

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
        return { outcome: primary, capped: false };
    }

    const secondary = resolveSecondaryRegions(countries, secondaryRegions);

    return { outcome: secondary, capped: secondary !== undefined };
};

const getCell = (
    timeZone: Outcome | undefined,
    { outcome, capped }: RegionResolution,
): PresenceEstimate => {
    const cell = CELLS[timeZone ?? 'missing'][outcome ?? 'missing'];

    if (capped && cell.evidence === 'strong') {
        return { ...cell, evidence: 'weak' };
    }

    return cell;
};

const isDisagreement = (ip: Outcome, other: Outcome | undefined) =>
    other !== undefined && other !== ip;

const resolveDeviceSignals = (
    countries: readonly CountryCode[],
    signals: DevicePresenceSignals,
) => {
    const timeZone = matchCountry(countries, getTimeZoneCountry(signals.timeZone));
    const region = resolveRegion(countries, signals);

    return { timeZone, region, cell: getCell(timeZone, region) };
};

export const estimatePresenceByDeviceSignals = (
    countries: readonly CountryCode[],
    signals: DevicePresenceSignals,
): PresenceEstimate => resolveDeviceSignals(countries, signals).cell;

export const estimatePresence = (
    countries: readonly CountryCode[],
    { ipCountry, ...deviceSignals }: PresenceSignals,
): PresenceEstimate => {
    const { timeZone, region, cell } = resolveDeviceSignals(countries, deviceSignals);
    const ip = matchCountry(countries, ipCountry);

    if (!ip) {
        return cell;
    }

    const odds = (cell.score / (1 - cell.score)) * IP_LR[ip];
    const isWeak =
        isDisagreement(ip, timeZone) || isDisagreement(ip, region.outcome) || region.capped;

    return { score: odds / (1 + odds), evidence: isWeak ? 'weak' : 'strong' };
};
