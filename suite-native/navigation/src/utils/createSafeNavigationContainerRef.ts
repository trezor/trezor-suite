import {
    NavigationContainerRefWithCurrent,
    createNavigationContainerRef,
} from '@react-navigation/native';

import { RootStackParamList } from '../navigators';

/**
 * Creates a safe navigation container ref that checks if navigation is ready
 * before executing navigation methods. If not ready, methods are safely ignored.
 */
export const createSafeNavigationContainerRef =
    (): NavigationContainerRefWithCurrent<RootStackParamList> => {
        const navigationRef = createNavigationContainerRef<RootStackParamList>();
        // Get all prototype methods to filter them out later
        const protoMethods = Object.getOwnPropertyNames(Object.prototype);

        return new Proxy(navigationRef, {
            get(target, prop) {
                const value = Reflect.get(target, prop);
                const isNavigationMethod =
                    typeof value === 'function' &&
                    typeof prop === 'string' &&
                    !protoMethods.includes(prop);

                if (!isNavigationMethod) return value;

                return (...args: any[]) => {
                    if (navigationRef.isReady()) {
                        return value.apply(target, args);
                    }

                    return undefined;
                };
            },
        });
    };
