import { useCallback } from 'react';

import { type Href, useRouter } from 'expo-router';

import { type SettingsStackRoutes } from '@suite-native/navigation';

export const useSettingsNavigateTo = () => {
    const router = useRouter();

    return useCallback(
        (routeName: SettingsStackRoutes): void => {
            router.push(`/SettingsScreenStack/${routeName}` as Href);
        },
        [router],
    );
};
