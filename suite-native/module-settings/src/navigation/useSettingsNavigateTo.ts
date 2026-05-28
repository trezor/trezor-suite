import { useCallback } from 'react';

import { useRouter } from 'expo-router';

import { type SettingsStackRoutes } from '@suite-native/navigation';

export const useSettingsNavigateTo = () => {
    const router = useRouter();

    return useCallback(
        (routeName: SettingsStackRoutes): void => {
            router.push(`/SettingsScreenStack/${routeName}`);
        },
        [router],
    );
};
