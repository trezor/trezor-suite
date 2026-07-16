import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSupportedLanguageLocale } from '../localeSlice';
import { getMessagesForLocale } from '../translationsMap';

export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    useEffect(() => {
        setMessages(getMessagesForLocale(supportedLanguageLocale));
    }, [supportedLanguageLocale]);

    return messages;
};
