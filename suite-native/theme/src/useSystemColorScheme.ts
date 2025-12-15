import { useColorScheme } from 'react-native';

import { type ThemeColorVariant } from '@trezor/theme';

export const useSystemColorScheme = (): ThemeColorVariant => {
    const colorScheme = useColorScheme();
    if (colorScheme === 'dark') {
        return 'dark';
    }

    return 'standard';
};
