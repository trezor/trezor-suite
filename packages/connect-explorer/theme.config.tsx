import { useRouter } from 'next/router';

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
        const { asPath } = useRouter();
        if (asPath !== '/') {
            return {
                titleTemplate: '%s – Trezor Connect Explorer',
            };
        }

        return {
            titleTemplate: 'Trezor Connect Explorer',
        };
    },
    footer: {
        text: 'Copyright belongs to Trezor company s.r.o. All rights reserved.',
    },
};

export default config;
