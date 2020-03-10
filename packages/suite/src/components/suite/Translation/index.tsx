import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ExtendedMessageDescriptor } from '@suite-types';
import HelperTooltip from './components/HelperTooltip';
import messages from '@suite/support/messages';

interface MsgType extends ExtendedMessageDescriptor {
    id: keyof typeof messages;
}

export const isMsgType = (props: MsgType | React.ReactNode): props is MsgType => {
    return typeof props === 'object' && props !== null && (props as MsgType).id !== undefined;
};

type PrimitiveType = string | number | boolean | Date | null | undefined;

/**
 * Util component that helps with rendering react-intl messages.
 * It extends the FormattedMessage API and adds prop 'children' (ReactNode or MessageDescriptor).
 * The standard way of using it is by passing all necessary props (id, defaultMessage) to the component (eg. by spreading message obj)
 * The alternative is to pass whole (Extended)MessageDescriptor object as a children.
 * If children prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage with the message. Otherwise it just simply render passed children.
 */
const Translation = (props: MsgType) => {
    const values: Record<string, PrimitiveType | React.ReactNode | ExtendedMessageDescriptor> = {};
    // message passed via props (id, defaultMessage, values)
    if (isMsgType(props)) {
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
                    values={Object.keys(values).length === 0 ? undefined : values}
                />
            </HelperTooltip>
        );
    }
    return null;
};

export { Translation };
