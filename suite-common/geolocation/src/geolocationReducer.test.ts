import {
    geolocationActions,
    geolocationInitialState,
    geolocationReducer,
} from './geolocationReducer';

describe('geolocationReducer', () => {
    it('records a fetch finished in the current generation', () => {
        const state = geolocationReducer(
            geolocationInitialState,
            geolocationActions.countryCodeFetchFinished({
                status: 'success',
                timestamp: 1000,
                generation: 0,
            }),
        );

        expect(state.countryCodeFetch).toEqual({ status: 'success', timestamp: 1000 });
    });

    it('drops a fetch started before the record was invalidated', () => {
        const invalidated = geolocationReducer(
            { ...geolocationInitialState, countryCodeFetch: { status: 'success', timestamp: 0 } },
            geolocationActions.invalidateCountryCodeFetch(),
        );
        const state = geolocationReducer(
            invalidated,
            geolocationActions.countryCodeFetchFinished({
                status: 'success',
                timestamp: 1000,
                generation: 0,
            }),
        );

        expect(state.countryCodeFetch).toBeNull();
        expect(state.countryCodeFetchGeneration).toBe(1);
    });
});
