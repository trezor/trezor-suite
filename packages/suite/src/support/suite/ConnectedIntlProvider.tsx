import React from 'react';
import { useSelector } from '@suite-hooks/useSelector';
import { isDev } from '@suite-utils/build';
import { IntlProvider } from '@suite/intl';

type ConnectedIntlProviderProps = {
    children: React.ReactNode;
};

export const ConnectedIntlProvider = ({ children }: ConnectedIntlProviderProps) => {
    const locale = useSelector(state => state.suite.settings.language);

    return (
        <IntlProvider locale={locale} isDev={isDev}>
            {children}
        </IntlProvider>
    );
};
