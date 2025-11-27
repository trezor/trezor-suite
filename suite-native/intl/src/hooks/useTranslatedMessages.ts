import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    LocaleSliceRootState,
    selectIsLanguageLocaleSupported,
    selectLocale,
} from '../localeSlice';
import { messages as defaultMessages } from '../messages';
import { SupportedLocaleCode } from '../types';
import { flatten } from '../utils';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../../translations/en-US.json'),
    'cs-CZ': require('../../translations/cs-CZ.json'),
    'de-DE': require('../../translations/de-DE.json'),
    'pt-BR': require('../../translations/pt-BR.json'),
    'ja-JP': require('../../translations/ja-JP.json'),
} as const satisfies Record<SupportedLocaleCode, any>;

// default values defined during the development.
const englishFallback = flatten(defaultMessages);

export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const locale = useSelector(selectLocale);

    const isLanguageLocaleSupported = useSelector((state: LocaleSliceRootState) =>
        selectIsLanguageLocaleSupported(state, locale),
    );

    useEffect(() => {
        const localizedMessages = isLanguageLocaleSupported
            ? LANGUAGE_TRANSLATIONS_MAP[locale as SupportedLocaleCode]
            : {};

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [locale, isLanguageLocaleSupported]);

    return messages;
};
