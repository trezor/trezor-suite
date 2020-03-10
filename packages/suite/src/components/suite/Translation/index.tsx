import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ExtendedMessageDescriptor } from '@suite-types';
import HelperTooltip from './components/HelperTooltip';
import messages from '@suite/support/messages';

type MsgType = ExtendedMessageDescriptor;

export const isMsgType = (props: MsgType | React.ReactNode): props is MsgType => {
    return typeof props === 'object' && props !== null && (props as MsgType).id !== undefined;
};

type PrimitiveType = string | number | boolean | Date | null | undefined;

const Translation = (props: MsgType) => {
    const values: Record<string, PrimitiveType | React.ReactNode | ExtendedMessageDescriptor> = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `Translation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? <Translation {...maybeMsg} /> : maybeMsg;
    });

    // pass undefined to a 'values' prop in case of an empty values object
    return (
        <HelperTooltip messageId={props.id}>
            <FormattedMessage
                id={props.id}
                {...messages[props.id]}
                {...props}
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        </HelperTooltip>
    );
};

export { Translation };
