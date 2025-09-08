import { useEffect, useState } from 'react';

import { NativeLocale } from '@suite-common/suite-types';

import { messages as defaultMessages } from '../messages';
import { flatten } from '../utils';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../../translations/en-US.json'),
    'cs-CZ': require('../../translations/cs-CZ.json'),
} as const satisfies Record<NativeLocale, any>;

// default values defined during the development.
const englishFallback = flatten(defaultMessages);

type UseTranslatedMessagesProps = {
    language: NativeLocale;
};

export const useTranslatedMessages = ({ language }: UseTranslatedMessagesProps) => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const localizedMessages = LANGUAGE_TRANSLATIONS_MAP[language];

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [language]);

    return messages;
};
