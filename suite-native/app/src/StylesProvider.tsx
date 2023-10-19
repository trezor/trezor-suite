import { ReactNode } from 'react';

import { createRenderer, StylesProvider as StylesStyleProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { useActiveColorScheme } from '@suite-native/theme';

type StylesProviderProps = {
    children: ReactNode;
};

const renderer = createRenderer();

export const StylesProvider = ({ children }: StylesProviderProps) => {
    const colorVariant = useActiveColorScheme();
    const theme = prepareNativeTheme({ colorVariant });

    return (
        <StylesStyleProvider theme={theme} renderer={renderer}>
            {children}
        </StylesStyleProvider>
    );
};
