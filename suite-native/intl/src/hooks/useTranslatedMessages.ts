import { useSelector } from 'react-redux';

import { getMessagesForLocale } from '../getMessagesForLocale';
import { selectSupportedLanguageLocale } from '../localeSlice';

export const useTranslatedMessages = (): Record<string, string> => {
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    return getMessagesForLocale(supportedLanguageLocale);
};
