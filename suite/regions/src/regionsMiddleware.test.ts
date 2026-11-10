import { type Middleware, configureStore } from '@reduxjs/toolkit';

import { TorStatus, torActions, torReducer } from '@suite/tor';
import { geolocationActions } from '@suite-common/geolocation';

import { regionsMiddleware } from './regionsMiddleware';

const mockRefresh = jest.fn();

jest.mock('@suite-common/regions', () => ({
    ...jest.requireActual('@suite-common/regions'),
    refreshPresenceIpCountryThunk: (params: unknown) => {
        mockRefresh(params);

        return () => Promise.resolve();
    },
}));

const createStore = (torStatus: TorStatus) => {
    const actions: unknown[] = [];
    const recordActions: Middleware = () => next => action => {
        actions.push(action);

        return next(action);
    };
    const store = configureStore({
        reducer: { tor: torReducer },
        preloadedState: { tor: { torStatus, torBootstrap: null } },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware()
                .prepend(recordActions)
                .concat(regionsMiddleware(() => ({}))),
    });

    return { store, actions };
};

describe('regionsMiddleware', () => {
    beforeEach(() => {
        mockRefresh.mockClear();
    });

    it.each([
        [TorStatus.Enabled, TorStatus.Disabled, true, true],
        [TorStatus.Error, TorStatus.Disabled, true, true],
        [TorStatus.Disabled, TorStatus.Enabling, true, false],
        [TorStatus.Disabled, TorStatus.Enabled, true, false],
        [TorStatus.Disabled, TorStatus.Disabled, false, false],
        [TorStatus.Enabled, TorStatus.Enabled, false, false],
    ] as const)(
        'Tor %s -> %s: invalidates %s, refreshes %s',
        (previous, next, shouldInvalidate, shouldRefresh) => {
            const { store, actions } = createStore(previous);

            store.dispatch(torActions.setTorStatus(next));

            expect(actions).toEqual(
                shouldInvalidate
                    ? expect.arrayContaining([geolocationActions.invalidateCountryCodeFetch()])
                    : expect.not.arrayContaining([geolocationActions.invalidateCountryCodeFetch()]),
            );
            expect(mockRefresh).toHaveBeenCalledTimes(shouldRefresh ? 1 : 0);

            if (shouldRefresh) {
                expect(mockRefresh).toHaveBeenCalledWith({ isIpLookupAllowed: true });
            }
        },
    );
});
