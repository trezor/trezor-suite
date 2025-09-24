import { useEffect, useState } from 'react';

import { NativeLocale } from '@suite-common/suite-types';
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
    language: NativeLocale;
};

export const useTranslatedMessages = ({ language }: UseTranslatedMessagesProps) => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);

    useEffect(() => {
        const localizedMessages = isLocalizationEnabled ? LANGUAGE_TRANSLATIONS_MAP[language] : {};

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [language, isLocalizationEnabled]);

    return messages;
};
