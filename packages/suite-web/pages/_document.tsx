import React from 'react';
import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import { resolveStaticPath } from '@suite-utils/nextjs';
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
                    <script
                        type="text/javascript"
                        src={resolveStaticPath('browser-detection/index.js')}
                    />
                    <link
                        media="all"
                        rel="stylesheet"
                        href={resolveStaticPath('fonts/fonts.css')}
                    />
                    <link rel="icon" href={resolveStaticPath('images/icons/favicon/favicon.png')} />
                    <link
                        rel="apple-touch-icon"
                        href={resolveStaticPath('images/icons/favicon/favicon.png')}
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
