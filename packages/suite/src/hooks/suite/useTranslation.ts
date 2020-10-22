import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import messages from '@suite/support/messages';
import { ExtendedMessageDescriptor } from '@suite-types';

type PrimitiveType = string | number | boolean | Date | null | undefined;

export const useTranslation = () => {
    const intl = useIntl();
    const translationString = useCallback(
        (id: ExtendedMessageDescriptor['id'], values?: { [key: string]: PrimitiveType }) => {
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
