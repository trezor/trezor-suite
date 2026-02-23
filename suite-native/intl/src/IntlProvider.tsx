// Polyfill to support plural syntax
import 'intl-pluralrules';

// Polyfill Intl for iOS D(Hermes doesn't support some Intl features natively on iOS)
// Always required - base polyfills
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
// Intl.ListFormat polyfill and locale data
import '@formatjs/intl-listformat/polyfill';
import '@formatjs/intl-listformat/locale-data/en';
import '@formatjs/intl-listformat/locale-data/cs';
import '@formatjs/intl-listformat/locale-data/de';
import '@formatjs/intl-listformat/locale-data/pt';
import '@formatjs/intl-listformat/locale-data/ja';

import { IntlProvider as ReactIntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';

import { useSystemLocaleListener } from './hooks/useSystemLocaleListener';
import { useTranslatedMessages } from './hooks/useTranslatedMessages';
import { DEFAULT_LOCALE } from './languages';
import { selectLocale } from './localeSlice';

export const IntlProvider = ({ children }: { children: React.ReactNode }) => {
    useSystemLocaleListener();

    const locale = useSelector(selectLocale);
    const messages = useTranslatedMessages();

    return (
        <ReactIntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            {children}
        </ReactIntlProvider>
    );
};
