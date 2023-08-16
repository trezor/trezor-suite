import { useTheme as useSCTheme } from 'styled-components';

export const useTheme = () => {
    const scTheme = useSCTheme();

    return scTheme;
};
