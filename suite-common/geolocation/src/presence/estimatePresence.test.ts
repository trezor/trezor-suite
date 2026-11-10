import { type CountryCode } from '../countries';
import { estimatePresence } from './estimatePresence';
import { type PresenceEvidence, type PresenceSignals } from './presenceTypes';

type Resolved = 'match' | 'mismatch' | 'missing';

const TIME_ZONES: Record<Resolved, string> = {
    match: 'Europe/London',
    mismatch: 'Europe/Prague',
    missing: 'Etc/UTC',
};

const COUNTRIES: Record<Resolved, string | null> = {
    match: 'GB',
    mismatch: 'CZ',
    missing: null,
};

const NO_SIGNALS: PresenceSignals = {
    ipCountry: null,
    timeZone: null,
    primaryRegion: null,
    secondaryRegions: [],
};

const estimate = (
    signals: Partial<PresenceSignals>,
    countries: readonly CountryCode[] = ['GB'],
) => {
    const { score, evidence } = estimatePresence(countries, { ...NO_SIGNALS, ...signals });

    return { score: Number(score.toFixed(2)), evidence };
};

describe(estimatePresence.name, () => {
    it.each([
        ['match', 'match', 'match', 1, 'strong'],
        ['match', 'match', 'mismatch', 0.5, 'weak'],
        ['match', 'match', 'missing', 0.99, 'strong'],
        ['match', 'mismatch', 'match', 1, 'weak'],
        ['match', 'mismatch', 'mismatch', 0.03, 'weak'],
        ['match', 'mismatch', 'missing', 0.75, 'weak'],
        ['match', 'missing', 'match', 1, 'strong'],
        ['match', 'missing', 'mismatch', 0.16, 'weak'],
        ['match', 'missing', 'missing', 0.95, 'weak'],
        ['mismatch', 'match', 'match', 0.99, 'weak'],
        ['mismatch', 'match', 'mismatch', 0.01, 'weak'],
        ['mismatch', 'match', 'missing', 0.45, 'weak'],
        ['mismatch', 'mismatch', 'match', 0.5, 'weak'],
        ['mismatch', 'mismatch', 'mismatch', 0, 'strong'],
        ['mismatch', 'mismatch', 'missing', 0.01, 'strong'],
        ['mismatch', 'missing', 'match', 0.92, 'weak'],
        ['mismatch', 'missing', 'mismatch', 0, 'strong'],
        ['mismatch', 'missing', 'missing', 0.1, 'weak'],
        ['missing', 'match', 'match', 1, 'strong'],
        ['missing', 'match', 'mismatch', 0.04, 'weak'],
        ['missing', 'match', 'missing', 0.8, 'weak'],
        ['missing', 'mismatch', 'match', 0.95, 'weak'],
        ['missing', 'mismatch', 'mismatch', 0, 'strong'],
        ['missing', 'mismatch', 'missing', 0.15, 'weak'],
        ['missing', 'missing', 'match', 0.99, 'strong'],
        ['missing', 'missing', 'mismatch', 0.01, 'strong'],
        ['missing', 'missing', 'missing', 0.5, 'none'],
    ] as const satisfies [Resolved, Resolved, Resolved, number, PresenceEvidence][])(
        'timezone %s, region %s, IP %s -> %d %s',
        (timeZone, region, ip, score, evidence) => {
            expect(
                estimate({
                    timeZone: TIME_ZONES[timeZone],
                    primaryRegion: COUNTRIES[region],
                    ipCountry: COUNTRIES[ip],
                }),
            ).toEqual({ score, evidence });
        },
    );

    it.each([
        ['T1', 0.5, 'none'],
        ['XX', 0.5, 'none'],
        ['zz', 0.5, 'none'],
        ['', 0.5, 'none'],
        [' gb ', 0.99, 'strong'],
    ] as const satisfies [string, number, PresenceEvidence][])(
        'normalizes IP country %j -> %d %s',
        (ipCountry, score, evidence) => {
            expect(estimate({ ipCountry, timeZone: 'Etc/UTC' })).toEqual({ score, evidence });
        },
    );

    it.each([
        ['capped downgrade', null, ['GB'], null, 0.99, 'weak'],
        ['capped in Variant 3', null, ['GB'], 'GB', 1, 'weak'],
        ['secondary mismatch', null, ['CZ', 'DE'], null, 0.75, 'weak'],
        ['unknown secondary resolves missing', null, ['ZZ'], null, 0.95, 'weak'],
        ['unknown secondary is not capped', null, ['ZZ'], 'GB', 1, 'strong'],
        ['invalid primary falls back to secondary', 'ZZ', ['GB'], null, 0.99, 'weak'],
    ] as const satisfies [
        string,
        string | null,
        string[],
        string | null,
        number,
        PresenceEvidence,
    ][])(
        'region resolution: %s',
        (_description, primaryRegion, secondaryRegions, ipCountry, score, evidence) => {
            expect(
                estimate({
                    timeZone: 'Europe/London',
                    primaryRegion,
                    secondaryRegions,
                    ipCountry,
                }),
            ).toEqual({ score, evidence });
        },
    );

    it('matches a signal pointing at any listed country', () => {
        expect(estimate({ timeZone: 'Europe/Jersey' }, ['GB', 'JE'])).toEqual({
            score: 0.95,
            evidence: 'weak',
        });
    });

    it('treats every known signal as mismatch for an empty country list', () => {
        expect(
            estimate({ timeZone: 'Europe/London', primaryRegion: 'GB', ipCountry: 'GB' }, []),
        ).toEqual({ score: 0, evidence: 'strong' });
    });

    it('does not resolve prototype keys as time zones', () => {
        expect(estimate({ timeZone: 'toString' })).toEqual({ score: 0.5, evidence: 'none' });
    });

    it.each([
        ['Mac in London, Tor on', null, 'Europe/London', 'GB', 0.99, 'strong'],
        [
            'Londoner in Prague, hand-set timezone, hotel Wi-Fi',
            'CZ',
            'Europe/London',
            'GB',
            0.5,
            'weak',
        ],
        ['Berliner on holiday in London, roaming SIM', 'DE', 'Europe/London', 'DE', 0.03, 'weak'],
        ['Tor Browser', null, null, null, 0.5, 'none'],
    ] as const satisfies [
        string,
        string | null,
        string | null,
        string | null,
        number,
        PresenceEvidence,
    ][])('%s', (_description, ipCountry, timeZone, primaryRegion, score, evidence) => {
        expect(estimate({ ipCountry, timeZone, primaryRegion })).toEqual({ score, evidence });
    });
});
