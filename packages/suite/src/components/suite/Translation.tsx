import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import {
    ExtendedMessageDescriptor as CommonExtendedMessageDescriptor,
    FormatXMLElementFn,
} from '@suite-common/intl-types';

// We cannot use aliases here because this file is directly imported by the @suite-common/intl-types
// It's little hacky by this will be solved when PR for refactor intl will be merged.
import messages from '../../support/messages';

export type TranslationKey = keyof typeof messages;

export type ExtendedMessageDescriptor = CommonExtendedMessageDescriptor;

export const isMsgType = (
    props: ReactNode | ExtendedMessageDescriptor | Date | FormatXMLElementFn,
): props is ExtendedMessageDescriptor =>
    typeof props === 'object' &&
    props !== null &&
    (props as ExtendedMessageDescriptor).id !== undefined;

export const Translation = (props: ExtendedMessageDescriptor) => {
    const values: Record<string, any> = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `Translation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? <Translation {...maybeMsg} /> : maybeMsg;
    });

    // prevent runtime errors
    if (
        !props.defaultMessage &&
        Object.prototype.hasOwnProperty.call(props, 'id') &&
        !messages[props.id]
    ) {
        return <>{`Unknown translation id: ${props.id}`}</>;
    }

    return (
        <FormattedMessage
            id={props.id}
            tagName="span"
            defaultMessage={props.defaultMessage || messages[props.id].defaultMessage}
            // pass undefined to a 'values' prop in case of an empty values object
            {...(Object.keys(values).length === 0 ? {} : { values })} // needed due to: "exactOptionalPropertyTypes": true
        />
    );
};
