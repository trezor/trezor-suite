import { createGlobalStyle } from 'styled-components';

import { typography } from '@trezor/theme';

export const GlobalStyle = createGlobalStyle`
    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    * {
        margin: 0;
        padding: 0;

        /* Only system fonts: the page loads nothing from other origins. */
        font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    html,
    body {
        min-height: 100%;
        background: ${({ theme }) => theme.surfaceFillPage};
        color: ${({ theme }) => theme.contentPrimary};
        -webkit-font-smoothing: antialiased;
        ${typography['body-md']}
    }

    :root {
        color-scheme: ${({ theme }) => theme.mode};
    }
`;
