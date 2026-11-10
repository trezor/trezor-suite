import {
    geolocationActions,
    geolocationInitialState,
    geolocationReducer,
} from './geolocationReducer';

const SYDNEY_AU = { timeZone: 'Australia/Sydney', primaryRegion: 'AU', secondaryRegions: [] };

describe('setDevicePresenceSignals', () => {
    it('keeps the state when the signals did not change', () => {
        const state = { ...geolocationInitialState, deviceSignals: SYDNEY_AU };

        expect(
            geolocationReducer(
                state,
                geolocationActions.setDevicePresenceSignals({ ...SYDNEY_AU }),
            ),
        ).toBe(state);
    });

    it('stores changed signals', () => {
        const state = { ...geolocationInitialState, deviceSignals: SYDNEY_AU };
        const next = { ...SYDNEY_AU, secondaryRegions: ['CZ'] };

        expect(
            geolocationReducer(state, geolocationActions.setDevicePresenceSignals(next))
                .deviceSignals,
        ).toEqual(next);
    });
});
