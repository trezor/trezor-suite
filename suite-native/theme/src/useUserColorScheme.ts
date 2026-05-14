import { useAtom } from 'jotai';

import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { type ThemeColorVariant } from '@trezor/theme';
export type AppColorScheme = ThemeColorVariant | 'system';

const userColorSchemeAtom = atomWithUnecryptedStorage<AppColorScheme>('colorScheme', 'system');

export const useUserColorScheme = () => {
    const [userColorScheme, setUserColorScheme] = useAtom(userColorSchemeAtom);
    const analytics = useAnalytics();
    const handleSetUserColorScheme = (colorScheme: AppColorScheme) => {
        setUserColorScheme(colorScheme);
        analytics.report({
            type: events.settingsChangeThemeEvent.name,
            payload: { theme: colorScheme },
        });
    };

    return {
        userColorScheme,
        setUserColorScheme: handleSetUserColorScheme,
    };
};
