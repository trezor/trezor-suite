import { ReactNode } from 'react';

import styled, { ThemeProvider as SCThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components/src/config/colors';

import { IntlProvider } from './components/IntlProvider';
import { GlobalStyle } from './styles/GlobalStyle';
import { defaultMessages } from './translations/default';
import { messages as cs } from './translations/cs';
import { useTheme } from './hooks/useTheme';

type AppProps = {
    children: ReactNode;
};

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
`;

export const App = ({ children }: AppProps) => {
    const themeVariant: 'light' | 'dark' = useTheme();
    const messages: Record<string, any> = { default: defaultMessages, cs };

    const language = window.navigator.language.split('-')[0];
    const navigatorLocaleIsSupported = Object.keys(messages).includes(language);
    const languageToUse = navigatorLocaleIsSupported ? language : 'en';
    const messagesToUse = messages[languageToUse] || defaultMessages;

    return (
        <div>
            <IntlProvider locale={languageToUse} messages={messagesToUse}>
                <GlobalStyle theme={intermediaryTheme[themeVariant]} />
                <SCThemeProvider theme={intermediaryTheme[themeVariant]}>
                    <Wrapper>{children}</Wrapper>
                </SCThemeProvider>
            </IntlProvider>
        </div>
    );
};
