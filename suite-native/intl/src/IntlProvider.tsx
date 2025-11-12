import { IntlProvider as ReactIntlProvider } from 'react-intl';

// Polyfill to support plural syntax
import 'intl-pluralrules';

import { useLocale } from './hooks/useLocale';
import { useTranslatedMessages } from './hooks/useTranslatedMessages';
import { DEFAULT_LOCALE } from './languages';

export const IntlProvider = ({ children }: { children: React.ReactNode }) => {
    const locale = useLocale();
    const messages = useTranslatedMessages();

    return (
        <ReactIntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            {children}
        </ReactIntlProvider>
    );
};
