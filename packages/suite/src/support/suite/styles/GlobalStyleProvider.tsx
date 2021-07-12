import * as React from 'react';

import animations from './animations';
import { notifications } from './notifications';
import { variables, SuiteThemeColors } from '@trezor/components';
import { createGlobalStyle } from 'styled-components';
import { SuiteThemeVariant } from '@suite/types/suite';
import { useTheme } from '@suite-hooks';

const GlobalStyle = createGlobalStyle<{ theme: SuiteThemeColors; themeVariant: SuiteThemeVariant }>`
    #__next {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: hidden;
    }

    input, textarea {
        outline: none;
    }

    body, html {
        background: ${props => props.theme.BG_GREY};
        font-size: ${variables.FONT_SIZE.NORMAL};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        height: 100%;
        overflow-y: hidden;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    * {
        margin: 0;
        padding: 0;
        outline: none;
        font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    :root {
        color-scheme: ${props => (props.themeVariant === 'light' ? 'light' : 'dark')};
    }

    ${animations}
    ${notifications}
`;

const GlobalStyleProvider = () => {
    const { theme, themeVariant } = useTheme();

    return <GlobalStyle theme={theme} themeVariant={themeVariant} />;
};

export default GlobalStyleProvider;
