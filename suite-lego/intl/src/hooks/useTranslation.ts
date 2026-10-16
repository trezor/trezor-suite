import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { type PrimitiveType } from '@trezor/type-utils';

import { messages } from '../messages';
import { type TranslationKey } from '../types';

export type TranslationFunction = (
    id: TranslationKey,
    values?: Record<string, PrimitiveType>,
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
