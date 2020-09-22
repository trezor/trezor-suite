import React from 'react';
import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { isDev } from '@suite-utils/build';
import { ServerStyleSheet } from 'styled-components';
import globalStyles from '@suite-support/styles/global';

export default class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();
        const originalRenderPage = ctx.renderPage;
        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: App => props => sheet.collectStyles(<App {...props} />),
                });
            const initialProps = await Document.getInitialProps(ctx);
            return {
                ...initialProps,
                styles: (
                    <>
                        {/* eslint-disable-next-line react/no-danger */}
                        <style dangerouslySetInnerHTML={{ __html: globalStyles }} key="styles" />
                        {initialProps.styles}
                        {sheet.getStyleElement()}
                    </>
                ),
            };
        } finally {
            sheet.seal();
        }
    }

    render() {
        return (
            // prevents chrome from auto offering page translation https://github.com/trezor/trezor-suite/issues/1806
            // remove 'translate' attr after release to test if fix in Translation component was enough to prevent the issue
            // @ts-ignore TODO: should be fixed in newer React
            <Html lang="en" translate="no">
                <Head>
                    <meta charSet="utf-8" />
                    <meta name="theme-color" content={process.env.themeColor} />
                    <script
                        type="text/javascript"
                        src={resolveStaticPath('browser-detection/index.js')}
                    />
                    <link
                        media="all"
                        rel="stylesheet"
                        href={resolveStaticPath('fonts/fonts.css')}
                    />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    {!isDev() && <link rel="manifest" href={resolveStaticPath('manifest.json')} />}
                </Head>
                <body>
                    <noscript>You need to enable JavaScript to run this app.</noscript>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
