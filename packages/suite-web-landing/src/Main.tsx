import React, { useState } from 'react';
import ReactDom from 'react-dom';
import { IntlProvider } from 'react-intl';
import { TranslationModeContext } from '../components/Translation';
import { resolveStaticPath } from '@suite-utils/build';
import Metadata from '@suite-components/Metadata';
import { URLS } from '@suite-constants';
import enLocale from '@trezor/suite-data/files/translations/en.json';
import { TranslationModeTrigger } from '../components/LandingPage';
import GlobalStyleProvider from '@suite-support/styles/GlobalStyleProvider';
import AppRouter from './support/Router';

const Main = () => {
    const [translationMode, setTranslationMode] = useState(false);

    return (
        <>
            <GlobalStyleProvider />
            <TranslationModeContext.Provider value={translationMode}>
                <IntlProvider locale="en" messages={enLocale}>
                    <Metadata
                        image={`${URLS.SUITE_URL}${resolveStaticPath(
                            'images/suite-web-landing/meta.png',
                        )}`}
                    />

                    <AppRouter />

                    <TranslationModeTrigger onClick={() => setTranslationMode(prev => !prev)} />
                </IntlProvider>
            </TranslationModeContext.Provider>
        </>
    );
};

export default <Main />;
