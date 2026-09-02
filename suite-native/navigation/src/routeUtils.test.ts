import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { checkIsActiveRouteAnyOf, checkIsHomeStackFocused } from './routeUtils';
import { DeviceOnboardingStackRoutes, HomeStackRoutes, RootStackRoutes } from './routes';

jest.mock('./components/NavigationContainerWithAnalytics', () => ({
    navigationContainerRef: {
        getState: jest.fn(),
        isReady: jest.fn().mockReturnValue(true),
    },
}));

const mockedNavigationContainerRef = navigationContainerRef as jest.Mocked<
    typeof navigationContainerRef
>;

describe('Navigation Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkIsActiveRouteAnyOf', () => {
        it('check is home stack focused', () => {
            mockedNavigationContainerRef.getState.mockReturnValue({
                stale: false,
                type: 'stack',
                key: 'stack-test1',
                index: 0,
                routeNames: [
                    RootStackRoutes.OnboardingStack,
                    RootStackRoutes.AppTabs,
                    RootStackRoutes.AccountSettings,
                ],
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: 'Home' },
                        key: 'AppTabs-test1',
                    },
                ],
            });

            const result = checkIsHomeStackFocused();

            expect(result).toBe(true);
        });

        it('should return false when active route does not match any of the provided routes', () => {
            mockedNavigationContainerRef.getState.mockReturnValue({
                stale: false,
                type: 'stack',
                key: 'stack-test2',
                index: 0,
                routeNames: [RootStackRoutes.AppTabs, RootStackRoutes.AccountSettings],
                routes: [
                    {
                        name: RootStackRoutes.AccountSettings,
                        key: 'AccountSettings-test2',
                    },
                ],
            });

            const routeList = [
                RootStackRoutes.OnboardingStack,
                RootStackRoutes.AuthorizeDeviceStack,
            ];
            const result = checkIsActiveRouteAnyOf(routeList);

            expect(result).toBe(false);
        });

        it('should return true for DeviceOnboardingStackRoutes', () => {
            mockedNavigationContainerRef.getState.mockReturnValue({
                stale: false,
                type: 'stack',
                key: 'stack-test4',
                index: 0,
                routeNames: [DeviceOnboardingStackRoutes.DeviceDisconnected],
                routes: [
                    {
                        name: DeviceOnboardingStackRoutes.DeviceDisconnected,
                        key: 'ConnectAndUnlockDevice-test4',
                    },
                ],
            });

            const routeList = [
                DeviceOnboardingStackRoutes.DeviceDisconnected,
                DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
            ];
            const result = checkIsActiveRouteAnyOf(routeList);

            expect(result).toBe(true);
        });

        it('should return true for HomeStackRoutes', () => {
            mockedNavigationContainerRef.getState.mockReturnValue({
                stale: false,
                type: 'stack',
                key: 'stack-test5',
                index: 0,
                routeNames: [HomeStackRoutes.Home],
                routes: [
                    {
                        name: HomeStackRoutes.Home,
                        key: 'Home-test5',
                    },
                ],
            });

            const routeList = [HomeStackRoutes.Home];
            const result = checkIsActiveRouteAnyOf(routeList);

            expect(result).toBe(true);
        });

        it('should handle multiple routes in navigation stack and check the last one', () => {
            mockedNavigationContainerRef.getState.mockReturnValue({
                stale: false,
                type: 'stack',
                key: 'stack-test6',
                index: 2,
                routeNames: [
                    RootStackRoutes.AppTabs,
                    RootStackRoutes.OnboardingStack,
                    RootStackRoutes.AuthorizeDeviceStack,
                ],
                routes: [
                    {
                        name: RootStackRoutes.OnboardingStack,
                        key: 'OnboardingStack-test6-2',
                    },
                    {
                        name: RootStackRoutes.AuthorizeDeviceStack,
                        key: 'AuthorizeDeviceStack-test6-3',
                    },
                    {
                        name: RootStackRoutes.AppTabs,
                        key: 'AppTabs-test6-1',
                    },
                ],
            });

            const routeList = [RootStackRoutes.AuthorizeDeviceStack];
            const result = checkIsActiveRouteAnyOf(routeList);

            expect(result).toBe(false);
        });
    });
});
