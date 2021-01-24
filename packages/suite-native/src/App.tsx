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
import Preloader from '@native-components/suite/Preloader';
import { initStore } from '@native/reducers/store';
import Router from '@native/support/suite/Router';
import ThemeProvider from '@native/support/suite/ThemeProvider';

// polyfills
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en'; // locale-data for en

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
