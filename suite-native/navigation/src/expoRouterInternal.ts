/*
expo-router-internal knowledge used by the imperative-navigation helpers. Isolated here so a
future expo-router upgrade only touches one file.

`__root` is the route name expo-router uses to wrap the entire app under its NavigationContainer.
Any direct call to `store.navigationRef.navigate(...)` or `store.navigationRef.reset(...)` at the
root level has to address this name.
 */
export const EXPO_ROUTER_ROOT_ROUTE_NAME = '__root';
