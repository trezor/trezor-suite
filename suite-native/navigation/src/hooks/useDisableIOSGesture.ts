import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';

import { type NavigationProp, type ParamListBase, useNavigation } from '@react-navigation/native';

type Navigation = NavigationProp<ParamListBase>;

const navigationToBlockerCount = new WeakMap<Navigation, number>();

const getNavigationChain = (navigation: Navigation) => {
    const chain: Navigation[] = [];
    let current: Navigation | undefined = navigation;

    while (current) {
        chain.push(current);
        current = current.getParent?.();
    }

    return chain;
};

export const useDisableIOSGesture = () => {
    const navigation = useNavigation<Navigation>();

    useLayoutEffect(() => {
        if (Platform.OS !== 'ios') {
            return;
        }

        const navigationChain = getNavigationChain(navigation);

        navigationChain.forEach(routeNavigation => {
            const blockerCount = navigationToBlockerCount.get(routeNavigation) ?? 0;
            if (blockerCount === 0) {
                routeNavigation.setOptions({ gestureEnabled: false });
            }
            navigationToBlockerCount.set(routeNavigation, blockerCount + 1);
        });

        return () => {
            navigationChain.forEach(routeNavigation => {
                const blockerCount = navigationToBlockerCount.get(routeNavigation) ?? 0;
                if (blockerCount > 1) {
                    navigationToBlockerCount.set(routeNavigation, blockerCount - 1);
                } else {
                    navigationToBlockerCount.delete(routeNavigation);
                    routeNavigation.setOptions({ gestureEnabled: true });
                }
            });
        };
    }, [navigation]);
};
