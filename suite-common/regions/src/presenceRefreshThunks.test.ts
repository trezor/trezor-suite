import {
    type CountryCodeFetch,
    PRESENCE_IP_REFRESH_INTERVAL_MS,
    fetchCountryCodeThunk,
    geolocationInitialState,
} from '@suite-common/geolocation';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

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
    flag?: boolean;
    countryCodeFetch?: CountryCodeFetch | null;
    generation?: number;
};

const createState = ({
    flag = true,
    countryCodeFetch = null,
    generation = 0,
}: StateParams = {}): RefreshPresenceIpCountryThunkState => ({
    messageSystem: mockMessageSystemStateWithFeatureFlags({
        [Feature.regions.presenceRestriction]: flag,
    }),
    geolocation: {
        ...geolocationInitialState,
        countryCodeFetch,
        countryCodeFetchGeneration: generation,
    },
});

const refresh = (state: RefreshPresenceIpCountryThunkState, isIpLookupAllowed = true) => {
    const getState = () => state;
    const { dispatch } = createMockDispatch({ getState });

    return refreshPresenceIpCountryThunk({ isIpLookupAllowed })(dispatch, getState, {});
};

describe(refreshPresenceIpCountryThunk.name, () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW);
        jest.mocked(fetchCountryCodeThunk).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('does not fetch when flag is off', async () => {
        await refresh(createState({ flag: false }));

        expect(fetchCountryCodeThunk).not.toHaveBeenCalled();
    });

    it('does not fetch when the IP lookup is not allowed', async () => {
        await refresh(createState(), false);

        expect(fetchCountryCodeThunk).not.toHaveBeenCalled();
    });

    it.each([
        ['fetches without a previous record', null, 1],
        [
            'does not fetch when the record is 29 minutes old',
            { status: 'success', timestamp: NOW - 29 * MINUTE },
            0,
        ],
        [
            'fetches when the record is exactly 30 minutes old',
            { status: 'success', timestamp: NOW - PRESENCE_IP_REFRESH_INTERVAL_MS },
            1,
        ],
        [
            'fetches when the record is in the future after a clock change',
            { status: 'success', timestamp: NOW + MINUTE },
            1,
        ],
        [
            'does not retry a recently failed fetch',
            { status: 'failed', timestamp: NOW - MINUTE },
            0,
        ],
    ] as const satisfies [string, CountryCodeFetch | null, number][])(
        '%s',
        async (_description, countryCodeFetch, expectedFetches) => {
            await refresh(createState({ countryCodeFetch }));

            expect(fetchCountryCodeThunk).toHaveBeenCalledTimes(expectedFetches);
        },
    );

    it('fetches once for concurrent calls', async () => {
        const state = createState();

        await Promise.all([refresh(state), refresh(state)]);

        expect(fetchCountryCodeThunk).toHaveBeenCalledTimes(1);
    });

    it('fetches again when the record was invalidated during a fetch', async () => {
        await Promise.all([refresh(createState()), refresh(createState({ generation: 1 }))]);

        expect(fetchCountryCodeThunk).toHaveBeenCalledTimes(2);
    });
});
