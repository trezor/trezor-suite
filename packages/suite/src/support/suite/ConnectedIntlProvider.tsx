import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectLanguage, selectShowTranslationKeys } from '@suite/settings';
import { IntlProvider } from '@suite-lego/intl';

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
