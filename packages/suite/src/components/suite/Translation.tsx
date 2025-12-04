import { FormattedMessage } from 'react-intl';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';

// We cannot use aliases here because this file is directly imported by the @suite-common/intl-types
// It's little hacky by this will be solved when PR for refactor intl will be merged.
import messages from '../../support/messages';

export type TranslationKey = keyof typeof messages;

export function isTranslationKey(key: unknown): key is TranslationKey {
    return typeof key === 'string' && Object.hasOwn(messages, key);
}

export const Translation = ({ defaultMessage, id, values }: ExtendedMessageDescriptor) => {
    // prevent runtime errors
    if (!defaultMessage && id !== undefined && !messages[id]) {
        return <>{`Unknown translation id: ${id}`}</>;
    }

    return (
        <FormattedMessage
            id={id}
            tagName="span"
            defaultMessage={defaultMessage || messages[id].defaultMessage}
            {...(values !== undefined && Object.keys(values).length === 0 ? {} : { values })} // needed due to: "exactOptionalPropertyTypes": true
        />
    );
};
