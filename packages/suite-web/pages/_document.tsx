import Document, { Head, Main, DocumentContext, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import React from 'react';
import { AppRegistry } from 'react-native';
import globalStyles from '@suite-support/styles/global';

interface Props {
    styleTags: any;
}

export default class MyDocument extends Document<Props> {
    static async getInitialProps({ renderPage }: DocumentContext) {
        AppRegistry.registerComponent('Main', () => Main);
        // @ts-ignore getApplication is React Native Web addition for SSR.
        const { getStyleElement } = AppRegistry.getApplication('Main');
        const sheet = new ServerStyleSheet();
        const page = renderPage(App => props => sheet.collectStyles(<App {...props} />));
        const styleTags = sheet.getStyleElement();
        const styles = [
            // eslint-disable-next-line react/no-danger
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} key="styles" />,
            getStyleElement(),
        ];
        return { ...page, styleTags, styles: React.Children.toArray(styles) };
    }

    render() {
        return (
            <html lang="en" style={{ height: '100%' }}>
                <Head>
                    <meta charSet="utf-8" />
                    <script
                        type="text/javascript"
                        src={resolveStaticPath('js/browserDetection.js')}
                    ></script>
                    <link
                        media="all"
                        rel="stylesheet"
                        href={resolveStaticPath('fonts/fonts.css')}
                    />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    {this.props.styleTags}
                </Head>
                <body style={{ height: '100%' }}>
                    <Main />
                    <NextScript />
                </body>
            </html>
        );
    }
}
