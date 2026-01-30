import { useAtom } from 'jotai';

import { EventType } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { ThemeColorVariant } from '@trezor/theme';
export type AppColorScheme = ThemeColorVariant | 'system';

const userColorSchemeAtom = atomWithUnecryptedStorage<AppColorScheme>('colorScheme', 'system');

export const useUserColorScheme = () => {
    const [userColorScheme, setUserColorScheme] = useAtom(userColorSchemeAtom);
    const analytics = useAnalytics();
    const handleSetUserColorScheme = (colorScheme: AppColorScheme) => {
        setUserColorScheme(colorScheme);
        analytics.report({
            type: EventType.SettingsChangeTheme,
            payload: { theme: colorScheme },
        });
    };

    return {
        userColorScheme,
        setUserColorScheme: handleSetUserColorScheme,
    };
};
