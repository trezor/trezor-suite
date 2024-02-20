import { useState, useEffect, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import enMessages from '@trezor/suite-data/files/translations/en.json';
import { useSelector } from 'src/hooks/suite/useSelector';
import { isDevEnv } from '@suite-common/suite-utils';
import type { Locale } from 'src/config/suite/languages';

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

interface ConnectedIntlProviderProps {
    children: ReactNode;
}

export const ConnectedIntlProvider = ({ children }: ConnectedIntlProviderProps) => {
    const locale = useSelector(state => state.suite.settings.language);
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
