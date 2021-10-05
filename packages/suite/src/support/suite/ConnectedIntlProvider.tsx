import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { useSelector } from '@suite-hooks/useSelector';
import { isDev } from '@suite-utils/build';

const ConnectedIntlProvider: React.FC = ({ children }) => {
    const { locale, messages } = useSelector(state => ({
        locale: state.suite.settings.language,
        messages: state.suite.messages,
    }));
    return (
        <IntlProvider
            locale={locale}
            messages={messages}
            onError={err => {
                if (isDev) {
                    // ignore, this expected
                    if (err.message.includes('MISSING_TRANSLATION')) {
                        return;
                    }
                    console.error(err);
                }
            }}
        >
            {children}
        </IntlProvider>
    );
};

export default ConnectedIntlProvider;
