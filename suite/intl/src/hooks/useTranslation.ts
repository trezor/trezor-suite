import { useCallback } from 'react';
import { type MessageDescriptor, useIntl } from 'react-intl';

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
                // widen to an untyped descriptor, `values` are not typed per message
                const descriptor: MessageDescriptor = messages[id];

                return intl.formatMessage(descriptor, values);
            }

            return `Unknown translation id: ${id}`;
        },
        [intl],
    );

    return {
        translationString,
    };
};
