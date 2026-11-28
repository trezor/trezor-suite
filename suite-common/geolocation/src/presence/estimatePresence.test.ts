import { type CountryCode } from '../countries';
import { applyLikelihoodRatio, estimatePresence } from './estimatePresence';
import { type PresenceEvidence, type PresenceSignals } from './presenceTypes';

type Resolved = 'match' | 'mismatch' | 'missing';

const TIME_ZONES: Record<Resolved, string> = {
    match: 'Australia/Sydney',
    mismatch: 'Europe/Prague',
    missing: 'Etc/UTC',
};

const COUNTRIES: Record<Resolved, string | null> = {
    match: 'AU',
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
    countries: readonly CountryCode[] = ['AU'],
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
        [' au ', 0.99, 'strong'],
    ] as const satisfies [string, number, PresenceEvidence][])(
        'normalizes IP country %j -> %d %s',
        (ipCountry, score, evidence) => {
            expect(estimate({ ipCountry, timeZone: 'Etc/UTC' })).toEqual({ score, evidence });
        },
    );

    it.each([
        ['secondary region lowers strong evidence to weak', null, ['AU'], null, 0.99, 'weak'],
        [
            'agreeing secondary region does not lower evidence with an IP',
            null,
            ['AU'],
            'AU',
            1,
            'strong',
        ],
        ['disagreeing secondary region lowers evidence with an IP', null, ['CZ'], 'AU', 1, 'weak'],
        ['secondary mismatch', null, ['CZ', 'DE'], null, 0.75, 'weak'],
        [
            'any matching secondary region wins over mismatches',
            null,
            ['CZ', 'AU'],
            null,
            0.99,
            'weak',
        ],
        ['unknown secondary resolves missing', null, ['ZZ'], null, 0.95, 'weak'],
        ['unknown secondary region does not lower evidence', null, ['ZZ'], 'AU', 1, 'strong'],
        ['invalid primary falls back to secondary', 'ZZ', ['AU'], null, 0.99, 'weak'],
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
                    timeZone: 'Australia/Sydney',
                    primaryRegion,
                    secondaryRegions,
                    ipCountry,
                }),
            ).toEqual({ score, evidence });
        },
    );

    it('lowers strong evidence to weak for a mismatching secondary region', () => {
        expect(estimate({ timeZone: 'Europe/Prague', secondaryRegions: ['CZ'] })).toEqual({
            score: 0.01,
            evidence: 'weak',
        });
    });

    it('returns a new object for every call', () => {
        const signals = { ...NO_SIGNALS, timeZone: 'Australia/Sydney' };
        const first = estimatePresence(['AU'], signals);

        first.evidence = 'none';

        expect(estimatePresence(['AU'], signals)).toEqual({ score: 0.95, evidence: 'weak' });
    });

    it('matches a signal pointing at any listed country', () => {
        expect(estimate({ timeZone: 'Indian/Christmas' }, ['AU', 'CX'])).toEqual({
            score: 0.95,
            evidence: 'weak',
        });
    });

    it('treats every known signal as mismatch for an empty country list', () => {
        expect(
            estimate({ timeZone: 'Australia/Sydney', primaryRegion: 'AU', ipCountry: 'AU' }, []),
        ).toEqual({ score: 0, evidence: 'strong' });
    });

    it.each([
        ['Mac in Sydney, Suite Tor toggle on', null, 'Australia/Sydney', 'AU', 0.99, 'strong'],
        [
            'Sydneysider in Prague, hand-set time zone, hotel Wi-Fi',
            'CZ',
            'Australia/Sydney',
            'AU',
            0.5,
            'weak',
        ],
        [
            'Berliner on holiday in Sydney, roaming SIM',
            'DE',
            'Australia/Sydney',
            'DE',
            0.03,
            'weak',
        ],
        ['Tor Browser', 'T1', null, null, 0.5, 'none'],
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

describe(applyLikelihoodRatio.name, () => {
    it.each([
        [0.5, 99, 0.99],
        [0.5, 0.01, 0.0099],
        [1, 0.01, 1],
        [0, 99, 0],
    ])('applies ratio to score %s with ratio %s -> %s', (score, likelihoodRatio, expected) => {
        expect(applyLikelihoodRatio(score, likelihoodRatio)).toBeCloseTo(expected, 4);
    });
});
