import { store } from 'expo-router/build/global-state/router-store';

/*
Reads the currently active leaf route name from expo-router's internal store. The store exposes
a real, attached NavigationContainerRefWithCurrent, so we can call getCurrentRoute() directly
without bridging through React state. Used by routeUtils from outside React (Redux middleware,
etc.) where hooks aren't available.
 */
export const getCurrentRouteName = (): string | undefined =>
    store.navigationRef.isReady() ? store.navigationRef.getCurrentRoute()?.name : undefined;
