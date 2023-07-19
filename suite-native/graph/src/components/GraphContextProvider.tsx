import React from 'react';
import { IntlProvider } from 'react-intl';

// FIXME this is only temporary until Intl refactor will be finished
import enMessages from '@trezor/suite-data/files/translations/en.json';
import { useActiveColorScheme } from '@suite-native/theme';
import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: React.ReactNode;
};

const renderer = createRenderer();

// Since react native skia `Canvas` is using its own renderer, the  React Native context
// is not available directly. This component re-injects the needed context providers.
// read more: https://shopify.github.io/react-native-skia/docs/canvas/contexts
export const GraphContextProvider = ({ children }: ProviderProps) => {
    const colorVariant = useActiveColorScheme();
    const theme = prepareNativeTheme({ colorVariant });

    return (
        <IntlProvider locale="en" defaultLocale="en" messages={enMessages}>
            <StylesProvider theme={theme} renderer={renderer}>
                {children}
            </StylesProvider>
        </IntlProvider>
    );
};
