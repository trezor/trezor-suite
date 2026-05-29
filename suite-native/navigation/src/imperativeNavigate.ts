import { store } from 'expo-router/build/global-state/router-store';

import { EXPO_ROUTER_ROOT_ROUTE_NAME } from './expoRouterInternal';

/*
expo-router's URL-based router only knows about file-based routes. Nested react-navigation
stacks (AuthorizeDeviceStack, DeviceOnboardingStack, …) have inner screens that aren't
file-based, so `router.navigate('/Outer/Inner')` falls through to the not-found route, and
`router.navigate({ pathname: '/Outer', params: { screen: 'Inner' } })` just lands on the
stack's initialRouteName (params get serialized as URL query, not interpreted as nested-stack
selection).

To reach an inner screen we have to call NavigationContainer.navigate directly against
expo-router's wrapped __root route, passing the standard react-navigation nested form
({ screen, params }). That's what the old navigationContainerRef proxy did; this helper
isolates the same translation in one place.

Will become unnecessary when the affected nested stacks are migrated to file-based routes.
 */
export const navigateNested = (
    route: string,
    nestedScreen: { screen: string; params?: object },
) => {
    if (!store.navigationRef.isReady()) return;

    store.navigationRef.navigate(
        EXPO_ROUTER_ROOT_ROUTE_NAME as never,
        {
            screen: route,
            params: nestedScreen,
        } as never,
    );
};
