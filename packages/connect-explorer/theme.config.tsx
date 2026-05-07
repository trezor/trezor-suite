import type { DocsThemeConfig } from '@trezor/connect-explorer-theme';

const config: DocsThemeConfig = {
    project: {
        link: 'https://github.com/trezor/trezor-suite',
    },
    docsRepositoryBase:
        'https://github.com/trezor/trezor-suite/tree/develop/packages/connect-explorer',
    darkMode: true,
    color: {
        hue: 140,
        saturation: 40,
    },
    seo: (asPath: string) => ({
        titleTemplate: asPath === '/' ? 'Trezor Connect Explorer' : '%s – Trezor Connect Explorer',
        description:
            'Trezor Connect is a tool for seamless integration of Trezor hardware wallet with third-party apps and extensions. Built with a developer-friendly interface, it ensures secure interactions for Trezor users within these apps.',
        twitter: {
            site: '@trezor',
            cardType: 'summary_large_image',
        },
        openGraph: {
            images: [
                {
                    url: `${process.env.CONNECT_EXPLORER_FULL_URL}/images/og-image.svg`,
                    width: 1200,
                    height: 630,
                    alt: 'Trezor Connect',
                },
            ],
        },
    }),
    footer: {
        content: 'Copyright belongs to Trezor company s.r.o. All rights reserved.',
    },
    editLink: {
        component: null,
    },
};

export default config;
