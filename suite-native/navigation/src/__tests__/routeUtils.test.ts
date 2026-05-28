import { getCurrentRouteName } from '../currentRoute';
import { checkIsActiveRouteAnyOf, checkIsHomeStackFocused } from '../routeUtils';
import {
    AppTabsRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '../routes';

jest.mock('../currentRoute', () => ({
    getCurrentRouteName: jest.fn(),
}));

const mockedGetCurrentRouteName = getCurrentRouteName as jest.Mock;

describe('Navigation Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkIsActiveRouteAnyOf', () => {
        it('returns true when home stack is the active leaf', () => {
            mockedGetCurrentRouteName.mockReturnValue(AppTabsRoutes.HomeStack);

            expect(checkIsHomeStackFocused()).toBe(true);
        });

        it('returns false when the active leaf does not match any of the provided routes', () => {
            mockedGetCurrentRouteName.mockReturnValue(RootStackRoutes.AccountSettings);

            const routeList = [
                RootStackRoutes.OnboardingStack,
                RootStackRoutes.AuthorizeDeviceStack,
            ];

            expect(checkIsActiveRouteAnyOf(routeList)).toBe(false);
        });

        it('returns true for DeviceOnboardingStackRoutes', () => {
            mockedGetCurrentRouteName.mockReturnValue(
                DeviceOnboardingStackRoutes.DeviceDisconnected,
            );

            const routeList = [
                DeviceOnboardingStackRoutes.DeviceDisconnected,
                DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
            ];

            expect(checkIsActiveRouteAnyOf(routeList)).toBe(true);
        });

        it('returns true for HomeStackRoutes', () => {
            mockedGetCurrentRouteName.mockReturnValue(HomeStackRoutes.Home);

            expect(checkIsActiveRouteAnyOf([HomeStackRoutes.Home])).toBe(true);
        });

        it('returns false when no route is active yet', () => {
            mockedGetCurrentRouteName.mockReturnValue(undefined);

            expect(checkIsActiveRouteAnyOf([RootStackRoutes.AppTabs])).toBe(false);
        });
    });
});
