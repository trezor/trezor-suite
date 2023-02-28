import { useAtom } from 'jotai';

import { ThemeColorVariant } from '@trezor/theme';
import { atomWithUnecryptedStorage } from '@suite-native/storage';

export type AppColorScheme = ThemeColorVariant | 'system';

const userColorSchemeAtom = atomWithUnecryptedStorage<AppColorScheme>('colorScheme', 'system');

export const useUserColorScheme = () => {
    const [userColorScheme, setUserColorScheme] = useAtom(userColorSchemeAtom);

    return {
        userColorScheme,
        setUserColorScheme,
    };
};
