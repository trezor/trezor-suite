import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { IntlProvider } from '@suite/intl';
import { selectLanguage, selectShowTranslationKeys } from '@suite/settings';

type ConnectedIntlProviderProps = {
    children: ReactNode;
};

export const ConnectedIntlProvider = ({ children }: ConnectedIntlProviderProps) => {
    const locale = useSelector(selectLanguage);
    const showTranslationKeys = useSelector(selectShowTranslationKeys);

    return (
        <IntlProvider locale={locale} showTranslationKeys={showTranslationKeys}>
            {children}
        </IntlProvider>
    );
};
