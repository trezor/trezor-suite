import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSupportedLanguageLocale } from '../localeSlice';
import { messages as defaultMessages } from '../messages';
import { SupportedLocaleCode } from '../types';
import { flatten } from '../utils';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../../translations/en-US.json'),
    'cs-CZ': require('../../translations/cs-CZ.json'),
    'de-DE': require('../../translations/de-DE.json'),
    'fr-FR': require('../../translations/fr-FR.json'),
    'pt-BR': require('../../translations/pt-BR.json'),
    'ja-JP': require('../../translations/ja-JP.json'),
    'zh-CN': require('../../translations/zh-CN.json'),
} as const satisfies Record<SupportedLocaleCode, any>;

// default values defined during the development.
const englishFallback = flatten(defaultMessages);

export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    useEffect(() => {
        const localizedMessages = LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale];

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [supportedLanguageLocale]);

    return messages;
};
