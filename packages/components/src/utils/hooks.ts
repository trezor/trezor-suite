import { useContext } from 'react';
import { ThemeContext } from '../support/ThemeProvider';
import { platform } from './env';
import { useTheme as useSCTheme } from 'styled-components';

export const useTheme = () => {
    // In react-native it retrieves theme from our own context
    // On web use Styled-Components hook/context instead
    const contextTheme = useContext(ThemeContext);
    const scTheme = useSCTheme();
    return platform === 'web' ? scTheme : contextTheme;
};
