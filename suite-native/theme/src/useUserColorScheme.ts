import { useAtom } from 'jotai';

import { ThemeColorVariant } from '@trezor/theme';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { analytics, EventType } from '@suite-native/analytics';

export type AppColorScheme = ThemeColorVariant | 'system';

const userColorSchemeAtom = atomWithUnecryptedStorage<AppColorScheme>('colorScheme', 'system');

export const useUserColorScheme = () => {
    const [userColorScheme, setUserColorScheme] = useAtom(userColorSchemeAtom);

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
