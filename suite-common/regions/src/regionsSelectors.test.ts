import {
    type CountryCode,
    type CountryCodeFetchStatus,
    type GeolocationState,
    estimatePresence,
    geolocationInitialState,
} from '@suite-common/geolocation';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { selectIsRegionRestricted } from './regionsSelectors';

jest.mock('@suite-common/geolocation', () => ({
    ...jest.requireActual('@suite-common/geolocation'),
    estimatePresence: jest.fn(jest.requireActual('@suite-common/geolocation').estimatePresence),
}));

const domain = Feature.regions.presenceRestriction;

type Signals = {
    ip: CountryCode | null;
    timeZone: string | null;
    region: string | null;
    fetchStatus?: CountryCodeFetchStatus;
};

const createGeolocation = ({
    ip,
    timeZone,
    region,
    fetchStatus = 'success',
}: Signals): GeolocationState => ({
    ...geolocationInitialState,
    countryCode: ip,
    countryCodeFetch: { status: fetchStatus, timestamp: 0 },
    deviceSignals: { timeZone, primaryRegion: region, secondaryRegions: [] },
});

const createState = (
    flag: boolean | undefined,
    payload: Record<string, unknown> | undefined,
    signals: Signals,
) => ({
    messageSystem: mockMessageSystemStateWithFeatureFlags(
        flag === undefined ? {} : { [domain]: flag },
        { [domain]: payload },
    ),
    geolocation: createGeolocation(signals),
});

const IN_AU: Signals = { ip: 'AU', timeZone: 'Australia/Sydney', region: 'AU' };
const IP_IN_DEVICE_OUTSIDE: Signals = { ip: 'AU', timeZone: 'Europe/Prague', region: 'CZ' };
const DEVICE_IN_IP_OUTSIDE: Signals = { ip: 'CZ', timeZone: 'Australia/Sydney', region: 'AU' };

describe(selectIsRegionRestricted.name, () => {
    beforeEach(() => {
        jest.mocked(estimatePresence).mockClear();
    });

    it.each([
        ['no regions entry', undefined, undefined],
        ['flag off', false, { countries: ['AU'] }],
        ['flag on without payload', true, undefined],
        ['flag on with empty countries', true, { countries: [] }],
        ['flag on with only invalid countries', true, { countries: ['ZZ', 1] }],
    ] as const satisfies [string, boolean | undefined, Record<string, unknown> | undefined][])(
        'is not restricted without a usable config: %s',
        (_description, flag, payload) => {
            expect(selectIsRegionRestricted(createState(flag, payload, IN_AU))).toBe(false);
            expect(estimatePresence).not.toHaveBeenCalled();
        },
    );

    it.each([
        ['strong presence in a listed country', IN_AU, undefined, true],
        [
            'IP in a listed country against the device settings',
            IP_IN_DEVICE_OUTSIDE,
            undefined,
            true,
        ],
        [
            'device settings in a listed country against the IP',
            DEVICE_IN_IP_OUTSIDE,
            undefined,
            false,
        ],
        ['presence above a configured threshold', DEVICE_IN_IP_OUTSIDE, 0.49, true],
        ['presence below a configured threshold', IP_IN_DEVICE_OUTSIDE, 0.6, false],
        ['an invalid configured threshold', IP_IN_DEVICE_OUTSIDE, 1.1, true],
        [
            'presence below the default threshold',
            { ip: 'DE', timeZone: 'Australia/Sydney', region: 'DE' },
            undefined,
            false,
        ],
        [
            'the last known IP after a failed refresh',
            { ...DEVICE_IN_IP_OUTSIDE, fetchStatus: 'failed' },
            undefined,
            false,
        ],
        ['no presence evidence', { ip: null, timeZone: null, region: null }, undefined, false],
    ] as const satisfies [string, Signals, number | undefined, boolean][])(
        '%s',
        (_description, signals, threshold, expected) => {
            const state = createState(true, { countries: ['AU'], threshold }, signals);

            expect(selectIsRegionRestricted(state)).toBe(expected);
        },
    );
});
