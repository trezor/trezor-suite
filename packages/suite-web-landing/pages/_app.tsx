import NextApp from 'next/app';
import Head from 'next/head';
import React from 'react';

class App extends NextApp {
    render() {
        const { Component, pageProps } = this.props;
        return (
            <>
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <title>Trezor Suite</title>
                </Head>
                <Component {...pageProps} />
            </>
        );
    }
}

export default App;
