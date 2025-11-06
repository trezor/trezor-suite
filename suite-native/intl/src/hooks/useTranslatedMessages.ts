import { useEffect, useState } from 'react';

import { messages as defaultMessages } from '../messages';
import { NativeLocale, isOfficiallySupportedNativeLocale } from '../types';
import { flatten } from '../utils';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../../translations/en-US.json'),
    'cs-CZ': require('../../translations/cs-CZ.json'),
} as const satisfies Record<NativeLocale, any>;

// default values defined during the development.
const englishFallback = flatten(defaultMessages);

type UseTranslatedMessagesProps = {
    locale: string;
};

export const useTranslatedMessages = ({ locale }: UseTranslatedMessagesProps) => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const localizedMessages = isOfficiallySupportedNativeLocale(locale)
            ? LANGUAGE_TRANSLATIONS_MAP[locale]
            : {};

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [locale]);

    return messages;
};
