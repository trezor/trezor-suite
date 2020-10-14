import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { ServerStyleSheet } from 'styled-components';
import globalStyles from '../support/styles';

export default class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();
        const originalRenderPage = ctx.renderPage;
        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: App => props =>
                        sheet.collectStyles(
                            <>
                                <App {...props} />
                            </>,
                        ),
                });
            const initialProps = await Document.getInitialProps(ctx);
            return {
                ...initialProps,
                styles: (
                    <>
                        {initialProps.styles}
                        {sheet.getStyleElement()}
                        {/* eslint-disable-next-line react/no-danger */}
                        <style dangerouslySetInnerHTML={{ __html: globalStyles }} key="styles" />
                    </>
                ),
            };
        } finally {
            sheet.seal();
        }
    }

    render() {
        return (
            <Html lang="en" style={{ height: '100%' }}>
                <Head>
                    <meta charSet="utf-8" />
                    <meta httpEquiv="Pragma" content="no-cache" />
                    <meta httpEquiv="cache-control" content="no-cache" />
                    <meta httpEquiv="expires" content="-1" />
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
                <body style={{ height: '100%' }}>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
