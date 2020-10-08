import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { useSelector } from '@suite-hooks/useSelector';

const ConnectedIntlProvider: React.FC = ({ children }) => {
    const { locale, messages } = useSelector(state => ({
        locale: state.suite.settings.language,
        messages: state.suite.messages,
    }));
    return (
        <IntlProvider locale={locale} messages={messages}>
            {children}
        </IntlProvider>
    );
};

export default ConnectedIntlProvider;
