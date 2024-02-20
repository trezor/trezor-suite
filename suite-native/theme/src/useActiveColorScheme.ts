import { useSystemColorScheme } from './useSystemColorScheme';
import { useUserColorScheme } from './useUserColorScheme';

export const useActiveColorScheme = () => {
    const { userColorScheme } = useUserColorScheme();
    const systemColorScheme = useSystemColorScheme();

    return userColorScheme === 'system' ? systemColorScheme : userColorScheme;
};
