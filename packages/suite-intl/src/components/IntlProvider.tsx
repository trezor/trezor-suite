import React, { useState, useEffect } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

import enMessages from '@suite/messages/translations/web/en.json';
import { Locale } from '../languages';

type IntlProviderProps = {
    children: React.ReactNode;
    locale: Locale;
    isDev: boolean;
};

const useFetchMessages = (locale: Locale) => {
    const [messages, setMessages] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        let active = true;
        const fetchMessages = async () => {
            const messages =
                locale === 'en'
                    ? {}
                    : await import(`@suite/messages/translations/web/${locale}.json`)
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

export const IntlProvider = ({ children, locale, isDev }: IntlProviderProps) => {
    const messages = useFetchMessages(locale);

    return (
        <ReactIntlProvider
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
        </ReactIntlProvider>
    );
};
