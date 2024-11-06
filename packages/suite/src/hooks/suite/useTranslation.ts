import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { PrimitiveType } from '@trezor/type-utils';

import messages from 'src/support/messages';
import { ExtendedMessageDescriptor } from 'src/types/suite';

export type TranslationFunction = (
    id: ExtendedMessageDescriptor['id'],
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
