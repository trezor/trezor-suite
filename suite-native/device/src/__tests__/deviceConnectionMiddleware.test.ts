import { type UnknownAction } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import {
    checkIsActiveRouteAnyOf,
    checkIsDeviceOnboardingFocused,
    checkIsHomeStackFocused,
    navigationContainerRef,
} from '@suite-native/navigation';

import {
    deviceConnectAuthorizedFixtures,
    deviceConnectBlockedFixtures,
    deviceConnectCompromisedFixtures,
    deviceConnectUninitializedFixtures,
    deviceDisconnectBlockedFixtures,
    deviceDisconnectDuringOnboardingFixtures,
    deviceDisconnectHomeResetFixtures,
    deviceDisconnectNotOnHomeFixtures,
    deviceDisconnectOnHomeFixtures,
    thpPairingBlockedFixtures,
    thpPairingNavigationFixtures,
} from './deviceConnectionFixtures';
import { deviceConnectionMiddleware } from '../middlewares/deviceConnectionMiddleware';

jest.mock('@suite-native/navigation', () => {
    const navigation = jest.requireActual('@suite-native/navigation');

    return {
        ...navigation,
        navigationContainerRef: {
            navigate: jest.fn(),
            reset: jest.fn(),
            isReady: jest.fn().mockReturnValue(true),
        },
        checkIsActiveRouteAnyOf: jest.fn().mockReturnValue(false),
        checkIsDeviceOnboardingFocused: jest.fn().mockReturnValue(false),
        checkIsHomeStackFocused: jest.fn().mockReturnValue(false),
    };
});

const createMockStoreAndDispatch = (initialState: any, action: UnknownAction) => {
    const mockStore = configureMockStore({
        middleware: [deviceConnectionMiddleware.middleware],
        preloadedState: initialState,
    });
    mockStore.dispatch(action);

    return mockStore;
};

describe('deviceConnectionMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('THP pairing navigation', () => {
        describe('when navigation should be blocked', () => {
            it.each(thpPairingBlockedFixtures)('$description', ({ action, initialState }) => {
                createMockStoreAndDispatch(initialState, action);

                expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
            });
        });

        describe('when navigation should proceed', () => {
            it.each(thpPairingNavigationFixtures)(
                '$description',
                ({ action, expectedNavigation, initialState }) => {
                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                        expectedNavigation.route,
                        expectedNavigation.params,
                    );
                    expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                },
            );
        });
    });

    describe('Device disconnect handling', () => {
        describe('when navigation should be blocked', () => {
            it.each(deviceDisconnectBlockedFixtures)('$description', ({ action, initialState }) => {
                createMockStoreAndDispatch(initialState, action);

                expect(navigationContainerRef.reset).not.toHaveBeenCalled();
                expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
            });
        });

        describe('when device disconnects during onboarding', () => {
            it.each(deviceDisconnectDuringOnboardingFixtures)(
                '$description',
                ({ action, expectedNavigation, initialState }) => {
                    jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(true);

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                        expectedNavigation.route,
                        expectedNavigation.params,
                    );
                    expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                },
            );
        });

        describe('when device disconnects while NOT on Home screen', () => {
            it.each(deviceDisconnectNotOnHomeFixtures)(
                '$description',
                ({ action, expectedReset, initialState }) => {
                    jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                    jest.mocked(checkIsHomeStackFocused).mockReturnValue(false);

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.reset).toHaveBeenCalledWith(expectedReset);
                    expect(navigationContainerRef.reset).toHaveBeenCalledTimes(1);
                },
            );
        });

        describe('when device disconnects while ON Home screen', () => {
            it.each(deviceDisconnectOnHomeFixtures)('$description', ({ action, initialState }) => {
                jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                jest.mocked(checkIsHomeStackFocused).mockReturnValue(true);

                createMockStoreAndDispatch(initialState, action);

                expect(navigationContainerRef.reset).not.toHaveBeenCalled();
                expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
            });
        });

        describe('when device disconnects and should reset to Home', () => {
            it.each(deviceDisconnectHomeResetFixtures)(
                '$description',
                ({ action, expectedReset, initialState }) => {
                    jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                    jest.mocked(checkIsHomeStackFocused).mockReturnValue(false);

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.reset).toHaveBeenCalledWith(expectedReset);
                    expect(navigationContainerRef.reset).toHaveBeenCalledTimes(1);
                },
            );
        });
    });

    describe('Device connection handling', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.mocked(checkIsActiveRouteAnyOf).mockReturnValue(false);
        });

        describe('when navigation should be blocked', () => {
            it.each(deviceConnectBlockedFixtures)(
                '$description',
                ({ description, action, initialState }) => {
                    // Specific mock for blacklisted route test
                    if (description.includes('blacklisted route')) {
                        jest.mocked(checkIsActiveRouteAnyOf).mockReturnValue(true);
                    }

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
                    expect(navigationContainerRef.reset).not.toHaveBeenCalled();
                },
            );
        });

        describe('when device is compromised', () => {
            it.each(deviceConnectCompromisedFixtures)(
                '$description',
                ({ action, expectedNavigation, initialState }) => {
                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                        expectedNavigation.route,
                        expectedNavigation.params,
                    );
                    expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                },
            );
        });

        describe('when device is uninitialized', () => {
            it.each(deviceConnectUninitializedFixtures)(
                '$description',
                ({ description, action, expectedReset, initialState }) => {
                    if (description.includes('onboarding was cancelled')) {
                        jest.mocked(checkIsHomeStackFocused).mockReturnValue(false);
                    }

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.reset).toHaveBeenCalledWith(expectedReset);
                    expect(navigationContainerRef.reset).toHaveBeenCalledTimes(1);
                },
            );
        });

        describe('when device is initialized', () => {
            it.each(deviceConnectAuthorizedFixtures)(
                '$description',
                ({ action, expectedNavigation, initialState }) => {
                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                        expectedNavigation.route,
                        expectedNavigation.params,
                    );
                    expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                },
            );
        });
    });
});
