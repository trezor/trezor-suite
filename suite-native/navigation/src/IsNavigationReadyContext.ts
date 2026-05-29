import { createContext } from 'react';

/*
True once the expo-router navigation container has mounted. Lets descendants defer side
effects that depend on navigation (e.g. global hooks reading the active route) until then.
Set by ExpoRouterNavigationBridge.
 */
export const IsNavigationReadyContext = createContext(false);
