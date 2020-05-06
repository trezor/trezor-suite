import NextApp from 'next/app';
import React from 'react';

class App extends NextApp {
    render() {
        const { Component, pageProps } = this.props;
        return <Component {...pageProps} />;
    }
}

export default App;
