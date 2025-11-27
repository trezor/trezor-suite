// Polyfill to support plural syntax
import 'intl-pluralrules';
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
