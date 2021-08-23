import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { TranslationModeContext } from '../components/Translation';
import { resolveStaticPath } from '@suite-utils/build';
import Metadata from '@suite-components/Metadata';
import { URLS } from '@suite-constants';
import enLocale from '@trezor/suite-data/files/translations/en.json';
import { TranslationModeTrigger } from '../components/LandingPage';
import AppRouter from './support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { store } from '@suite/reducers/store';
import history from '@suite/support/history';

const Main = () => {
    const [translationMode, setTranslationMode] = useState(false);

    return (
        <>
            <ReduxProvider store={store}>
                <ThemeProvider>
                    <RouterProvider history={history}>
                        <TranslationModeContext.Provider value={translationMode}>
                            <IntlProvider locale="en" messages={enLocale}>
                                <Metadata
                                    image={`${URLS.SUITE_URL}${resolveStaticPath(
                                        'images/suite-web-landing/meta.png',
                                    )}`}
                                />

                                <AppRouter />

                                <TranslationModeTrigger
                                    onClick={() => setTranslationMode(prev => !prev)}
                                />
                            </IntlProvider>
                        </TranslationModeContext.Provider>
                    </RouterProvider>
                </ThemeProvider>
            </ReduxProvider>
        </>
    );
};

export default <Main />;
