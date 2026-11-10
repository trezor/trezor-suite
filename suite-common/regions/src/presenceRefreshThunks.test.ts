import {
    type CountryCodeFetch,
    fetchCountryCodeThunk,
    geolocationInitialState,
} from '@suite-common/geolocation';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    PRESENCE_IP_REFRESH_INTERVAL_MS,
    PRESENCE_IP_RETRY_INTERVAL_MS,
} from './presenceConstants';
import {
    type RefreshPresenceIpCountryThunkState,
    refreshPresenceIpCountryThunk,
} from './presenceRefreshThunks';

jest.mock('@suite-common/geolocation', () => ({
    ...jest.requireActual('@suite-common/geolocation'),
    fetchCountryCodeThunk: jest.fn(() => () => Promise.resolve()),
}));

const NOW = 100 * PRESENCE_IP_REFRESH_INTERVAL_MS;
const MINUTE = 60_000;

type StateParams = {
    countryCodeFetch?: CountryCodeFetch | null;
};

const createState = ({
    countryCodeFetch = null,
}: StateParams = {}): RefreshPresenceIpCountryThunkState => ({
    geolocation: {
        ...geolocationInitialState,
        countryCodeFetch,
    },
});

const refresh = (state: RefreshPresenceIpCountryThunkState) => {
    const getState = () => state;
    const { dispatch } = createMockDispatch({ getState });

    return refreshPresenceIpCountryThunk()(dispatch, getState, {});
};

describe(refreshPresenceIpCountryThunk.name, () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW);
        jest.mocked(fetchCountryCodeThunk).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each([
        ['fetches without a previous record', null, 1],
        [
            'does not fetch when a successful record is 59 minutes old',
            { status: 'success', timestamp: NOW - 59 * MINUTE },
            0,
        ],
        [
            'fetches when a successful record is exactly 1 hour old',
            { status: 'success', timestamp: NOW - PRESENCE_IP_REFRESH_INTERVAL_MS },
            1,
        ],
        [
            'fetches when the record is in the future after a clock change',
            { status: 'success', timestamp: NOW + MINUTE },
            1,
        ],
        [
            'does not retry a failed fetch after 4 minutes',
            { status: 'failed', timestamp: NOW - 4 * MINUTE },
            0,
        ],
        [
            'retries a failed fetch after exactly 5 minutes',
            { status: 'failed', timestamp: NOW - PRESENCE_IP_RETRY_INTERVAL_MS },
            1,
        ],
    ] as const satisfies [string, CountryCodeFetch | null, number][])(
        '%s',
        async (_description, countryCodeFetch, expectedFetches) => {
            await refresh(createState({ countryCodeFetch }));

            expect(fetchCountryCodeThunk).toHaveBeenCalledTimes(expectedFetches);
        },
    );
});
