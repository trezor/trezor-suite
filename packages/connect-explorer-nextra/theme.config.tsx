import type { DocsThemeConfig } from '@trezor/connect-explorer-theme';

const config: DocsThemeConfig = {
    project: {
        link: 'https://github.com/trezor/trezor-suite',
    },
    docsRepositoryBase: 'https://github.com/trezor/trezor-suite',
    darkMode: true,
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
};

export default config;
