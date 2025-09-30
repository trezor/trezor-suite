import { UnknownAction } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { navigationContainerRef } from '@suite-native/navigation';

import { connectDeviceFixtures, getInitialState } from './deviceConnectionFixtures';
import { deviceConnectionMiddleware } from '../middlewares/deviceConnectionMiddleware';

jest.mock('@suite-native/navigation', () => {
    const navigation = jest.requireActual('@suite-native/navigation');

    return {
        ...navigation,
        navigationContainerRef: {
            navigate: jest.fn(),
            reset: jest.fn(),
            getState: jest.fn(),
        },
        checkIsActiveRouteAnyOf: jest.fn().mockReturnValue(false),
        checkIsDeviceOnboardingFocused: jest.fn().mockReturnValue(false),
        checkIsHomeStackFocused: jest.fn().mockReturnValue(false),
    };
});

type State = ReturnType<typeof getInitialState>;

describe('DEVICE.CONNECT', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    connectDeviceFixtures.forEach(
        ({
            action,
            initialState,
            redirectTarget,
            description,
            isReset = false,
            expectNoNavigation = false,
        }: {
            action: UnknownAction;
            initialState: ReturnType<typeof getInitialState>;
            redirectTarget: any;
            description: string;
            isReset?: boolean;
            expectNoNavigation?: boolean;
        }) => {
            it(description, () => {
                const mockStore = configureMockStore<State>({
                    middleware: [deviceConnectionMiddleware.middleware],
                    preloadedState: initialState,
                });
                mockStore.dispatch(action);

                if (expectNoNavigation) {
                    expect(navigationContainerRef.reset).toHaveBeenCalledTimes(0);
                    expect(navigationContainerRef.navigate).toHaveBeenCalledTimes(0);

                    return;
                }

                if (isReset) {
                    expect(navigationContainerRef.reset).toHaveBeenCalledWith(redirectTarget);
                } else {
                    if (redirectTarget.params) {
                        expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                            redirectTarget.route,
                            redirectTarget.params,
                        );
                    } else {
                        expect(navigationContainerRef.navigate).toHaveBeenCalledWith(
                            redirectTarget.route,
                        );
                    }
                }
            });
        },
    );
});
