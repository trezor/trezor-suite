import { useEffect, useState } from 'react';

import { NativeLocale, isSupportedNativeLocale } from '@suite-common/suite-types';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { messages as defaultMessages } from '../messages';
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
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);

    useEffect(() => {
        const localizedMessages =
            isLocalizationEnabled && isSupportedNativeLocale(locale)
                ? LANGUAGE_TRANSLATIONS_MAP[locale]
                : {};

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [locale, isLocalizationEnabled]);

    return messages;
};
