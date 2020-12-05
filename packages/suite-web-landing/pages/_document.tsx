import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { ServerStyleSheet } from 'styled-components';
import globalStyles from '../support/styles';
import { isEnabled } from '@suite-utils/features';
import { URLS } from '@suite-constants';

const isOnionLocation = isEnabled('ONION_LOCATION_META');

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
                    <meta name="title" content="Trezor Suite" />
                    <meta
                        name="description"
                        content="New desktop &amp; browser app for Trezor hardware wallets. Trezor Suite brings big improvements across our three key pillars of usability, security and privacy."
                    />

                    {/* Open Graph / Facebook */}
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content={URLS.SUITE_URL} />
                    <meta property="og:title" content="Trezor Suite" />
                    <meta
                        property="og:description"
                        content="New desktop &amp; browser app for Trezor hardware wallets. Trezor Suite brings big improvements across our three key pillars of usability, security and privacy."
                    />
                    <meta
                        property="og:image"
                        content={`${URLS.SUITE_URL}${resolveStaticPath(
                            'images/suite-web-landing/meta.png',
                        )}`}
                    />

                    {/* Twitter */}
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content={URLS.SUITE_URL} />
                    <meta property="twitter:title" content="Trezor Suite" />
                    <meta
                        property="twitter:description"
                        content="New desktop &amp; browser app for Trezor hardware wallets. Trezor Suite brings major improvements across our three key pillars of usability, security and privacy."
                    />
                    <meta
                        property="twitter:image"
                        content={`${URLS.SUITE_URL}${resolveStaticPath(
                            'images/suite-web-landing/meta.png',
                        )}`}
                    />

                    <meta charSet="utf-8" />
                    <meta httpEquiv="Pragma" content="no-cache" />
                    <meta httpEquiv="cache-control" content="no-cache" />
                    <meta httpEquiv="expires" content="-1" />
                    {isOnionLocation && (
                        <meta
                            httpEquiv="onion-location"
                            content="http://suite.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion"
                        />
                    )}
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
