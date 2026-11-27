import { type GeolocationState, geolocationInitialState } from '@suite-common/geolocation';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { getPresenceDiagnosticsRows, selectPresenceDiagnostics } from './presenceDiagnostics';

const domain = Feature.regions.presenceRestriction;

const IP_DE_LONDON_CZ: GeolocationState = {
    ...geolocationInitialState,
    countryCode: 'DE',
    countryCodeFetch: { status: 'success', timestamp: 0 },
    deviceSignals: { timeZone: 'Europe/London', primaryRegion: 'CZ', secondaryRegions: [] },
};

const createState = (
    geolocation: GeolocationState,
    flag?: boolean,
    payload?: Record<string, unknown>,
) => ({
    messageSystem: mockMessageSystemStateWithFeatureFlags(
        flag === undefined ? {} : { [domain]: flag },
        { [domain]: payload },
    ),
    geolocation,
});

const roundCandidates = (state: ReturnType<typeof createState>) =>
    selectPresenceDiagnostics(state).candidates.map(({ country, score, evidence }) => [
        country,
        Number(score.toFixed(2)),
        evidence,
    ]);

describe('selectPresenceDiagnostics', () => {
    it('ranks every country the signals point at by its presence score', () => {
        expect(roundCandidates(createState(IP_DE_LONDON_CZ))).toEqual([
            ['DE', 0.5, 'weak'],
            ['GB', 0.03, 'weak'],
            ['CZ', 0.01, 'weak'],
        ]);
    });

    it('evaluates the configured countries when the flag is on', () => {
        const diagnostics = selectPresenceDiagnostics(
            createState(IP_DE_LONDON_CZ, true, { countries: ['DE'] }),
        );

        expect(diagnostics).toMatchObject({
            isFlagEnabled: true,
            countries: ['DE'],
            timeZoneCountry: 'GB',
            isRestricted: true,
        });
        expect(diagnostics.estimate?.evidence).toBe('weak');
    });

    it.each([
        ['the flag is off', false, { countries: ['GB'] }],
        ['no country is configured', true, { countries: [] }],
    ])('has no estimate when %s', (_description, flag, payload) => {
        const diagnostics = selectPresenceDiagnostics(createState(IP_DE_LONDON_CZ, flag, payload));

        expect(diagnostics.estimate).toBeNull();
        expect(diagnostics.isRestricted).toBe(false);
    });

    it('has no candidates without signals', () => {
        expect(selectPresenceDiagnostics(createState(geolocationInitialState)).candidates).toEqual(
            [],
        );
    });
});

const getRows = (state: ReturnType<typeof createState>) =>
    Object.fromEntries(
        getPresenceDiagnosticsRows(selectPresenceDiagnostics(state)).map(({ label, value }) => [
            label,
            value,
        ]),
    );

describe(getPresenceDiagnosticsRows.name, () => {
    it('describes the restriction, the signals and the most likely country', () => {
        expect(getRows(createState(IP_DE_LONDON_CZ, true, { countries: ['DE'] }))).toEqual({
            Restricted: 'yes (DE 0.500 ≥ 0.499, weak)',
            Signals: 'IP DE | time zone Europe/London (GB) | region CZ',
            'Most likely country': 'DE (DE 0.500, GB 0.029, CZ 0.008)',
        });
    });

    it('names the threshold an unrestricted estimate stays below', () => {
        expect(getRows(createState(IP_DE_LONDON_CZ, true, { countries: ['GB'] })).Restricted).toBe(
            'no (GB 0.029 < 0.499, weak)',
        );
    });

    it.each([
        ['the flag is off', false, { countries: ['DE'] }, 'no (flag off)'],
        ['no country is configured', true, { countries: [] }, 'no (no countries)'],
    ])('explains why nothing is evaluated when %s', (_description, flag, payload, restricted) => {
        expect(getRows(createState(IP_DE_LONDON_CZ, flag, payload)).Restricted).toBe(restricted);
    });

    it('describes missing signals', () => {
        expect(getRows(createState(geolocationInitialState, true, { countries: ['DE'] }))).toEqual({
            Restricted: 'no (DE, evidence none)',
            Signals: 'IP not fetched yet | time zone missing | region none',
            'Most likely country': 'no signal',
        });
    });

    it.each([
        ['the last known IP', 'DE', 'IP DE'],
        ['no IP yet', null, 'IP missing'],
    ] as const)(
        'shows %s after a failed fetch and secondary regions',
        (_description, countryCode, ip) => {
            const geolocation: GeolocationState = {
                ...geolocationInitialState,
                countryCode,
                countryCodeFetch: { status: 'failed', timestamp: 0 },
                deviceSignals: {
                    timeZone: 'UTC',
                    primaryRegion: null,
                    secondaryRegions: ['DE', 'AT'],
                },
            };

            expect(getRows(createState(geolocation)).Signals).toBe(
                `${ip} (last fetch failed at 1970-01-01T00:00:00.000Z) | time zone UTC (no country) | region none, secondary DE, AT`,
            );
        },
    );
});
