import { UnknownAction } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import {
    checkIsDeviceOnboardingFocused,
    checkIsHomeStackFocused,
    navigationContainerRef,
} from '@suite-native/navigation';

import {
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
            thpPairingBlockedFixtures.forEach(({ description, action, initialState }) => {
                it(description, () => {
                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
                });
            });
        });

        describe('when navigation should proceed', () => {
            thpPairingNavigationFixtures.forEach(
                ({ description, action, expectedNavigation, initialState }) => {
                    it(description, () => {
                        createMockStoreAndDispatch(initialState, action);

                        expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                            expectedNavigation.route,
                            expectedNavigation.params,
                        );
                        expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                    });
                },
            );
        });
    });

    describe('Device disconnect handling', () => {
        describe('when navigation should be blocked', () => {
            deviceDisconnectBlockedFixtures.forEach(({ description, action, initialState }) => {
                it(description, () => {
                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.reset).not.toHaveBeenCalled();
                    expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
                });
            });
        });

        describe('when device disconnects during onboarding', () => {
            deviceDisconnectDuringOnboardingFixtures.forEach(
                ({ description, action, expectedNavigation, initialState }) => {
                    it(description, () => {
                        jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(true);

                        createMockStoreAndDispatch(initialState, action);

                        expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                            expectedNavigation.route,
                            {
                                screen: expectedNavigation.params.screen,
                                params: expectedNavigation.params.params,
                            },
                        );
                        expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(1);
                    });
                },
            );
        });

        describe('when device disconnects while NOT on Home screen', () => {
            deviceDisconnectNotOnHomeFixtures.forEach(
                ({ description, action, expectedReset, initialState }) => {
                    it(description, () => {
                        jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                        jest.mocked(checkIsHomeStackFocused).mockReturnValue(false);

                        createMockStoreAndDispatch(initialState, action);

                        expect(navigationContainerRef.reset).toHaveBeenCalledWith(expectedReset);
                        expect(navigationContainerRef.reset).toHaveBeenCalledTimes(1);
                    });
                },
            );
        });

        describe('when device disconnects while ON Home screen', () => {
            deviceDisconnectOnHomeFixtures.forEach(({ description, action, initialState }) => {
                it(description, () => {
                    jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                    jest.mocked(checkIsHomeStackFocused).mockReturnValue(true);

                    createMockStoreAndDispatch(initialState, action);

                    expect(navigationContainerRef.reset).not.toHaveBeenCalled();
                    expect(navigationContainerRef.navigate).not.toHaveBeenCalled();
                });
            });
        });

        describe('when device disconnects and should reset to Home', () => {
            deviceDisconnectHomeResetFixtures.forEach(
                ({ description, action, expectedReset, initialState }) => {
                    it(description, () => {
                        jest.mocked(checkIsDeviceOnboardingFocused).mockReturnValue(false);
                        jest.mocked(checkIsHomeStackFocused).mockReturnValue(false);

                        createMockStoreAndDispatch(initialState, action);

                        expect(navigationContainerRef.reset).toHaveBeenCalledWith(expectedReset);
                        expect(navigationContainerRef.reset).toHaveBeenCalledTimes(1);
                    });
                },
            );
        });
    });
});
