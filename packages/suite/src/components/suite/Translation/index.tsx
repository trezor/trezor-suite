import React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { ExtendedMessageDescriptor } from '@suite-types';

export const isChildrenMessageDescriptor = (
    message: React.ReactNode | ExtendedMessageDescriptor,
): message is ExtendedMessageDescriptor => {
    return (
        typeof message === 'object' &&
        message !== null &&
        (message as ExtendedMessageDescriptor).defaultMessage !== undefined
    );
};

interface Props extends Partial<ExtendedMessageDescriptor> {
    children?: React.ReactNode | ExtendedMessageDescriptor;
}

type PrimitiveType = string | number | boolean | Date | null | undefined;

// TODO: Problems
// 1. all props are optional so we are losing strict check if all necessary props are passed

/**
 * Util component that helps with rendering react-intl messages.
 * It extends the FormattedMessage API and adds prop 'children' (ReactNode or MessageDescriptor).
 * The standard way of using it is by passing all necessary props (id, defaultMessage) to the component (eg. by spreading message obj)
 * The alternative is to pass whole (Extended)MessageDescriptor object as a children.
 * If children prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage with the message. Otherwise it just simply render passed children.
 */
const Translation = ({ children, ...props }: Props) => {
    const values: Record<string, PrimitiveType | React.ReactNode> = {};

    // passed children prop (component or ExtendedMessageDescriptor obj)
    if (isChildrenMessageDescriptor(children)) {
        if (children.values) {
            // Message with variables passed via 'values' prop.
            // Value entry can also contain a MessageDescriptor.
            // Copy values and extract necessary messages to a new 'values' object
            Object.keys(children.values).forEach(key => {
                values[key] = <Translation>{children.values![key]}</Translation>;
            });
        }

        // pass undefined to a 'values' prop in case of an empty values object
        return (
            <FormattedMessage
                {...children}
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        );
    }

    // message passed via props (id, defaultMessage, values)
    // TODO: type guard?
    if (props.id && props.defaultMessage) {
        Object.keys(props.values || []).forEach(key => {
            values[key] = <Translation>{props.values![key]}</Translation>;
        });
        return (
            <FormattedMessage
                {...(props as MessageDescriptor)} // override the Partial<MessageDescriptor>, these props are mandatory
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        );
    }
    return <>{children}</>;
};

export { Translation };
