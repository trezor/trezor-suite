import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { geolocationActions, geolocationInitialState } from './geolocationReducer';
import { type GeolocationRootState } from './geolocationSelectors';
import { fetchCountryCodeThunk } from './geolocationThunks';

const state: GeolocationRootState = { geolocation: geolocationInitialState };

const fetchCountryCode = async () => {
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState });

    await fetchCountryCodeThunk()(dispatch, getState, {});

    return actions;
};

const failed = geolocationActions.countryCodeFetchFinished({
    status: 'failed',
    timestamp: 1000,
    generation: 0,
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
        fetchSpy.mockResolvedValue(Response.json({ country: 'gb ' }));

        expect(await fetchCountryCode()).toEqual([
            expect.objectContaining({ type: fetchCountryCodeThunk.pending.type }),
            geolocationActions.setCountryCode('GB'),
            geolocationActions.countryCodeFetchFinished({
                status: 'success',
                timestamp: 1000,
                generation: 0,
            }),
            expect.objectContaining({ type: fetchCountryCodeThunk.fulfilled.type }),
        ]);
    });

    it.each([
        ['the country is not a string', () => Promise.resolve(Response.json({ country: 1 }))],
        [
            'the response is not OK',
            () => Promise.resolve(Response.json({ country: 'GB' }, { status: 500 })),
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
});
