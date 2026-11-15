import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { COUNTRY_CODE_FETCH_TIMEOUT_MS } from './geolocationConstants';
import { geolocationActions, geolocationInitialState } from './geolocationReducer';
import { type GeolocationRootState } from './geolocationSelectors';
import { fetchCountryCodeThunk } from './geolocationThunks';

const state: GeolocationRootState = { geolocation: geolocationInitialState };

const fetchCountryCode = async (currentState: GeolocationRootState = state) => {
    const getState = () => currentState;
    const { actions, dispatch } = createMockDispatch({ getState });

    await fetchCountryCodeThunk()(dispatch, getState, {});

    return actions;
};

const failed = geolocationActions.countryCodeFetchFinished({
    status: 'failed',
    timestamp: 1000,
});

describe(fetchCountryCodeThunk.name, () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(1000);
    });

    afterEach(() => {
        jest.useRealTimers();
        fetchSpy.mockReset();
    });

    afterAll(() => {
        fetchSpy.mockRestore();
    });

    it('stores the normalized country and records a successful fetch', async () => {
        fetchSpy.mockResolvedValue(Response.json({ country: 'au ' }));

        expect(await fetchCountryCode()).toEqual([
            expect.objectContaining({ type: fetchCountryCodeThunk.pending.type }),
            geolocationActions.setCountryCode('AU'),
            geolocationActions.countryCodeFetchFinished({
                status: 'success',
                timestamp: 1000,
            }),
            expect.objectContaining({ type: fetchCountryCodeThunk.fulfilled.type }),
        ]);
    });

    it.each([
        ['the country is not a string', () => Promise.resolve(Response.json({ country: 1 }))],
        [
            'the country is not a country code',
            () => Promise.resolve(Response.json({ country: 'ZZ' })),
        ],
        [
            'the response is not OK',
            () => Promise.resolve(Response.json({ country: 'AU' }, { status: 500 })),
        ],
        ['the request fails', () => Promise.reject(new Error('Network error'))],
    ])('records a failed fetch when %s', async (_description, response) => {
        fetchSpy.mockImplementation(response);

        expect(await fetchCountryCode()).toEqual([
            expect.objectContaining({ type: fetchCountryCodeThunk.pending.type }),
            failed,
            expect.objectContaining({ type: fetchCountryCodeThunk.fulfilled.type }),
        ]);
    });

    it('stores the Tor country code', async () => {
        fetchSpy.mockResolvedValue(Response.json({ country: 'T1' }));

        expect(await fetchCountryCode()).toContainEqual(geolocationActions.setCountryCode('T1'));
    });

    it('records the fetch without changing an unchanged country', async () => {
        fetchSpy.mockResolvedValue(Response.json({ country: 'AU' }));

        const actions = await fetchCountryCode({
            geolocation: { ...geolocationInitialState, countryCode: 'AU' },
        });

        expect(actions).not.toContainEqual(geolocationActions.setCountryCode('AU'));
        expect(actions).toContainEqual(
            geolocationActions.countryCodeFetchFinished({ status: 'success', timestamp: 1000 }),
        );
    });

    it('records a failed fetch when the request times out', async () => {
        fetchSpy.mockImplementation(() => new Promise(() => {}));

        const actions = fetchCountryCode();
        await jest.advanceTimersByTimeAsync(COUNTRY_CODE_FETCH_TIMEOUT_MS);

        expect(await actions).toContainEqual(
            geolocationActions.countryCodeFetchFinished({
                status: 'failed',
                timestamp: 1000 + COUNTRY_CODE_FETCH_TIMEOUT_MS,
            }),
        );
    });

    it('sends one request for concurrent fetches', async () => {
        fetchSpy.mockResolvedValue(Response.json({ country: 'AU' }));

        await Promise.all([fetchCountryCode(), fetchCountryCode()]);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
});
