import { store } from 'expo-router/build/global-state/router-store';

import { EXPO_ROUTER_ROOT_ROUTE_NAME } from './expoRouterInternal';

type RootResetState = Parameters<typeof store.navigationRef.reset>[0];

export const resetNavigationRoot = (state: RootResetState) => {
    if (!store.navigationRef.isReady()) return;

    store.navigationRef.reset({
        index: 0,
        routes: [{ name: EXPO_ROUTER_ROOT_ROUTE_NAME as never, state: state as never }],
    });
};
