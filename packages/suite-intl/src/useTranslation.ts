import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { messages, MessageId, MessageValuesValue } from '@suite/messages';

export type TranslationFunction = (
    id: MessageId,
    values?: Record<string, MessageValuesValue>,
) => string;

export const useTranslation = () => {
    const intl = useIntl();

    const translationString = useCallback<TranslationFunction>(
        (id, values) => {
            if (id && messages[id]) {
                return intl.formatMessage(messages[id], values);
            }

            return `Unknown translation id: ${id}`;
        },
        [intl],
    );

    return {
        translationString,
    };
};
