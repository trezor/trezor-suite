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

type OwnProps = {
    isNested?: boolean;
};

export type ExtendedMessageDescriptor = CommonExtendedMessageDescriptor;
type MsgType = OwnProps & ExtendedMessageDescriptor;

export const isMsgType = (
    props: MsgType | ReactNode | ExtendedMessageDescriptor | Date | FormatXMLElementFn,
): props is MsgType =>
    typeof props === 'object' && props !== null && (props as MsgType).id !== undefined;

export const Translation = (props: MsgType) => {
    const values: Record<string, any> = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `Translation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? <Translation {...maybeMsg} isNested /> : maybeMsg;
    });

    // prevent runtime errors
    if (
        !props.defaultMessage &&
        Object.prototype.hasOwnProperty.call(props, 'id') &&
        !messages[props.id]
    ) {
        return <>{`Unknown translation id: ${props.id}`}</>;
    }

    const defaultTagName = props.isNested ? undefined : 'span';

    return (
        <FormattedMessage
            id={props.id}
            tagName={defaultTagName}
            defaultMessage={props.defaultMessage || messages[props.id].defaultMessage}
            // pass undefined to a 'values' prop in case of an empty values object
            values={Object.keys(values).length === 0 ? undefined : values}
        />
    );
};
