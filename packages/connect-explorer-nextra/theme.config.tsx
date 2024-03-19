import React from 'react';

import type { DocsThemeConfig } from '@trezor/connect-explorer-theme';
import { TrezorLogo } from '@trezor/components';

const config: DocsThemeConfig = {
    logo: <TrezorLogo type="horizontal" width={150} />,
    project: {
        link: 'https://github.com/trezor/trezor-suite',
    },
    docsRepositoryBase: 'https://github.com/trezor/trezor-suite',
    darkMode: false,
    primaryHue: 140,
    primarySaturation: 40,
    useNextSeoProps() {
        return {
            titleTemplate: '%s – Trezor Connect',
        };
    },
    footer: {
        text: 'Copyright belongs to Trezor company s.r.o. All rights reserved.',
    },
    nextThemes: {
        forcedTheme: 'light',
    },
};

export default config;
