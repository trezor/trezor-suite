import { IntlProvider as ReactIntlProvider } from 'react-intl';

// Polyfill to support plural syntax
import 'intl-pluralrules';

import { DEFAULT_LANGUAGE } from './constants';
import { useLanguage } from './hooks/useLanguage';
import { useTranslatedMessages } from './hooks/useTranslatedMessages';

export const IntlProvider = ({ children }: { children: React.ReactNode }) => {
    const language = useLanguage();
    const messages = useTranslatedMessages({ language });

    return (
        <ReactIntlProvider locale={language} defaultLocale={DEFAULT_LANGUAGE} messages={messages}>
            {children}
        </ReactIntlProvider>
    );
};
