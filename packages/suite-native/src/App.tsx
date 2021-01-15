/**
 * Main file corresponding with @suite-web/pages/_app.tsx || @suite-desktop/pages/_app.tsx
 * Differences:
 * - removed next.js references
 * - added react-native references
 */

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import './support/global';
import IntlProvider from '@suite/support/suite/ConnectedIntlProvider';
import Preloader from '@suite-components/Preloader';
import { initStore } from '@suite/reducers/store';
import Router from '@suite-support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <ReduxProvider store={store}>
            <IntlProvider>
                <ThemeProvider>
                    <Preloader>
                        <Router />
                    </Preloader>
                </ThemeProvider>
            </IntlProvider>
        </ReduxProvider>
    );
};

export default TrezorSuite;
