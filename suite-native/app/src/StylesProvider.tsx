import { ReactNode } from 'react';

import { useActiveColorScheme } from '@suite-native/theme';
import { StylesProvider as StylesStyleProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

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
