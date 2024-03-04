import React from 'react';

import type { AppProps } from 'next/app';

import '../styles/globals.css';

// eslint-disable-next-line import/no-default-export
export default function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
