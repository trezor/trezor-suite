import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { LocaleSliceRootState, selectIsLanguageLocaleSupported } from '../localeSlice';
import { messages as defaultMessages } from '../messages';
import { SupportedLanguage } from '../types';
import { flatten } from '../utils';
import { useLocale } from './useLocale';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../../translations/en-US.json'),
    'cs-CZ': require('../../translations/cs-CZ.json'),
} as const satisfies Record<SupportedLanguage, any>;

// default values defined during the development.
const englishFallback = flatten(defaultMessages);

export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const locale = useLocale();

    const isLanguageLocaleSupported = useSelector((state: LocaleSliceRootState) =>
        selectIsLanguageLocaleSupported(state, locale),
    );

    useEffect(() => {
        const localizedMessages = isLanguageLocaleSupported
            ? LANGUAGE_TRANSLATIONS_MAP[locale as SupportedLanguage]
            : {};

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [locale, isLanguageLocaleSupported]);

    return messages;
};
