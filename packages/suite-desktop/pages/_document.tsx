import React from 'react';
import Document, { DocumentContext, Head, Main, NextScript } from 'next/document';
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
            <html lang="en">
                <Head>
                    <meta charSet="utf-8" />
                    <link
                        media="all"
                        rel="stylesheet"
                        href={resolveStaticPath('fonts/fonts.css')}
                    />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <body style={{ overflow: 'hidden' }}>
                    <Main />
                    <NextScript />
                </body>
            </html>
        );
    }
}
