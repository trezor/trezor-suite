import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import enMessages from '@trezor/suite-data/files/translations/en.json';
import { useSelector } from '@suite-hooks/useSelector';
import { isDev } from '@suite-utils/build';
import type { Locale } from '@suite-config/languages';

const useFetchMessages = (locale: Locale) => {
    const [messages, setMessages] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        let active = true;
        const fetchMessages = async () => {
            const messages =
                locale === 'en'
                    ? {}
                    : await import(`@trezor/suite-data/files/translations/${locale}.json`)
                          .then(res => res.default)
                          .catch(() => ({}));
            if (!active) return;
            setMessages({ ...enMessages, ...messages });
        };
        fetchMessages();
        return () => {
            active = false;
        };
    }, [locale]);

    return messages;
};

const ConnectedIntlProvider: React.FC = ({ children }) => {
    const locale = useSelector(state => state.suite.settings.language);
    const messages = useFetchMessages(locale);
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
