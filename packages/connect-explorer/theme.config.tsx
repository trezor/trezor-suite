import { useRouter } from 'next/router';

import type { DocsThemeConfig } from '@trezor/connect-explorer-theme';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectFromEntries } from '@trezor/utils';

import { connectExplorerNetworkConfig } from './src/config/networks';

const config: DocsThemeConfig = {
    networkRoutes: typedObjectFromEntries(
        connectExplorerNetworkConfig.flatMap(({ route, symbol }): [string, NetworkSymbol][] =>
            route === null ? [] : [[route, symbol]],
        ),
    ),
    project: {
        link: 'https://github.com/trezor/trezor-suite',
    },
    docsRepositoryBase:
        'https://github.com/trezor/trezor-suite/tree/develop/packages/connect-explorer',
    darkMode: true,
    primaryHue: 140,
    primarySaturation: 40,
    useNextSeoProps() {
        const { asPath } = useRouter();
        let titleTemplate = 'Trezor Connect Explorer';
        if (asPath !== '/') {
            titleTemplate = '%s – Trezor Connect Explorer';
        }

        return {
            titleTemplate,
            description:
                'Trezor Connect is a tool for seamless integration of Trezor hardware wallet with third-party apps and extensions. Built with a developer-friendly interface, it ensures secure interactions for Trezor users within these apps.',
            twitter: {
                site: '@trezor',
                cardType: 'summary_large_image',
            },
            openGraph: {
                images: [
                    {
                        // must be an absolute url
                        url: `${process.env.CONNECT_EXPLORER_FULL_URL}/images/og-image.svg`,
                        width: 1200,
                        height: 630,
                        alt: 'Trezor Connect',
                    },
                ],
            },
        };
    },
    footer: {
        text: 'Copyright belongs to Trezor company s.r.o. All rights reserved.',
    },
    editLink: {
        component: null,
    },
};

export default config;
