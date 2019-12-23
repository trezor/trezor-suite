/**
 * Main file corresponding with @suite-web/pages/_app.tsx || @suite-desktop/pages/_app.tsx
 * Differences:
 * - removed next.js references
 * - added react-native references
 */

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import './support/global';
// import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Preloader from '@suite-components/Preloader';
import { initStore } from '@suite/reducers/store';
import Router from '@suite-support/Router';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <ReduxProvider store={store}>
            {/* <IntlProvider> */}
            <Preloader>
                <Router />
            </Preloader>
            {/* </IntlProvider> */}
        </ReduxProvider>
    );
};

export default TrezorSuite;
