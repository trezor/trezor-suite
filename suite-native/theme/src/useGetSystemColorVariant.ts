import { useColorScheme } from 'react-native';

import { ThemeColorVariant } from '@trezor/theme';

export const useGetSystemColorVariant = (): ThemeColorVariant => {
    const colorScheme = useColorScheme();
    if (colorScheme === 'dark') {
        return 'dark';
    }
    return 'standard';
};
