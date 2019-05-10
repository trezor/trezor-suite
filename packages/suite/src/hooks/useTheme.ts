import React, { useContext } from 'react';
import { lightTheme } from '@trezor/components/themes/lightTheme';

export const ThemeContext = React.createContext(lightTheme);

export const useTheme = () => {
    return useContext(ThemeContext);
};
