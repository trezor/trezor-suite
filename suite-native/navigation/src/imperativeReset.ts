import { store } from 'expo-router/build/global-state/router-store';

/*
expo-router wraps the entire navigation tree under a single root route named '__root'. To call
NavigationContainer.reset(...) at the expo-router root we have to wrap the desired state under
that name. This is the only piece of expo-router-internal knowledge we still depend on; isolated
here so an expo-router upgrade only requires patching one constant.
 */
const EXPO_ROUTER_ROOT_ROUTE_NAME = '__root';

type RootResetState = Parameters<typeof store.navigationRef.reset>[0];

export const resetNavigationRoot = (state: RootResetState) => {
    if (!store.navigationRef.isReady()) return;

    store.navigationRef.reset({
        index: 0,
        routes: [{ name: EXPO_ROUTER_ROOT_ROUTE_NAME as never, state: state as never }],
    });
};
