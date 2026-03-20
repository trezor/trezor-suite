import { type ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import type { Locale } from '@suite-common/suite-types';
import { isDevEnv } from '@suite-common/suite-utils';
import enMessages from '@trezor/suite-data/files/translations/en-US.json';

import { useSelector } from 'src/hooks/suite/useSelector';

const useFetchMessages = (locale: Locale) => {
    const [messages, setMessages] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        let active = true;
        const fetchMessages = async () => {
            const messages =
                locale === 'en-US'
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

interface ConnectedIntlProviderProps {
    children: ReactNode;
}

export const ConnectedIntlProvider = ({ children }: ConnectedIntlProviderProps) => {
    const locale = useSelector(state => state.suiteSettings.language);
    const messages = useFetchMessages(locale);

    return (
        <IntlProvider
            locale={locale}
            messages={messages}
            onError={err => {
                if (isDevEnv) {
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
