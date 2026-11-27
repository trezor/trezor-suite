import {
    type CountryCode,
    type CountryCodeFetch,
    type PresenceEstimate,
    type PresenceEvidence,
    type PresenceSignals,
    estimatePresence,
    getTimeZoneCountry,
    isKnownCountryCode,
    selectCountryCodeFetch,
} from '@suite-common/geolocation';
import {
    getRegionRestrictedCountries,
    getRegionRestrictionThreshold,
} from '@suite-common/message-system';

import {
    createRegionsSelector,
    selectPresenceRestriction,
    selectPresenceRestrictionFeature,
    selectPresenceSignals,
} from './regionsSelectors';

export type PresenceCandidate = { country: CountryCode; score: number; evidence: PresenceEvidence };

export type PresenceDiagnostics = {
    isFlagEnabled: boolean;
    countries: CountryCode[];
    threshold: number;
    countryCodeFetch: CountryCodeFetch | null;
    signals: PresenceSignals;
    timeZoneCountry: CountryCode | null;
    estimate: PresenceEstimate | null;
    isRestricted: boolean;
    candidates: PresenceCandidate[];
};

export type PresenceDiagnosticsRow = { label: string; value: string };

const getCandidates = (signals: PresenceSignals, timeZoneCountry: CountryCode | null) => {
    const countries = [
        signals.ipCountry,
        timeZoneCountry,
        signals.primaryRegion,
        ...signals.secondaryRegions,
    ].filter((country): country is CountryCode => country !== null && isKnownCountryCode(country));

    return [...new Set(countries)]
        .map(country => ({ country, ...estimatePresence([country], signals) }))
        .sort((a, b) => b.score - a.score);
};

export const selectPresenceDiagnostics = createRegionsSelector(
    [
        selectPresenceRestrictionFeature,
        selectPresenceSignals,
        selectCountryCodeFetch,
        selectPresenceRestriction,
    ],
    (feature, signals, countryCodeFetch, { estimate, isRestricted }): PresenceDiagnostics => {
        const timeZoneCountry = getTimeZoneCountry(signals.timeZone) ?? null;

        return {
            isFlagEnabled: feature?.flag === true,
            countries: getRegionRestrictedCountries(feature),
            threshold: getRegionRestrictionThreshold(feature),
            countryCodeFetch,
            signals,
            timeZoneCountry,
            estimate,
            isRestricted,
            candidates: getCandidates(signals, timeZoneCountry),
        };
    },
);

const formatScore = (score: number) => score.toFixed(3);

const formatRestriction = ({
    isFlagEnabled,
    countries,
    threshold,
    estimate,
    isRestricted,
}: PresenceDiagnostics) => {
    if (!isFlagEnabled) {
        return 'no (flag off)';
    }

    if (!estimate) {
        return 'no (no countries)';
    }

    const configured = countries.join('+');

    if (estimate.evidence === 'none') {
        return `no (${configured}, evidence none)`;
    }

    const comparison = isRestricted ? '≥' : '<';

    return `${isRestricted ? 'yes' : 'no'} (${configured} ${formatScore(estimate.score)} ${comparison} ${threshold}, ${estimate.evidence})`;
};

const formatIpCountry = ({ signals, countryCodeFetch }: PresenceDiagnostics) => {
    if (!countryCodeFetch) {
        return 'IP not fetched yet';
    }

    const ip = `IP ${signals.ipCountry ?? 'missing'}`;

    if (countryCodeFetch.status === 'success') {
        return ip;
    }

    return `${ip} (last fetch failed at ${new Date(countryCodeFetch.timestamp).toISOString()})`;
};

const formatRegion = ({ primaryRegion, secondaryRegions }: PresenceSignals) => {
    const region = `region ${primaryRegion ?? 'none'}`;

    return secondaryRegions.length > 0
        ? `${region}, secondary ${secondaryRegions.join(', ')}`
        : region;
};

const formatSignals = (diagnostics: PresenceDiagnostics) => {
    const { signals, timeZoneCountry } = diagnostics;
    const timeZone = signals.timeZone
        ? `time zone ${signals.timeZone} (${timeZoneCountry ?? 'no country'})`
        : 'time zone missing';

    return [formatIpCountry(diagnostics), timeZone, formatRegion(signals)].join(' | ');
};

const formatMostLikelyCountry = ({ candidates }: PresenceDiagnostics) => {
    const [mostLikely] = candidates;

    if (!mostLikely) {
        return 'no signal';
    }

    const ranking = candidates
        .map(({ country, score }) => `${country} ${formatScore(score)}`)
        .join(', ');

    return `${mostLikely.country} (${ranking})`;
};

export const getPresenceDiagnosticsRows = (
    diagnostics: PresenceDiagnostics,
): PresenceDiagnosticsRow[] => [
    { label: 'Restricted', value: formatRestriction(diagnostics) },
    { label: 'Signals', value: formatSignals(diagnostics) },
    { label: 'Most likely country', value: formatMostLikelyCountry(diagnostics) },
];
