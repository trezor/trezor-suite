import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ExtendedMessageDescriptor } from '@suite-types';

export const isChildrenMessageDescriptor = (
    message: null | React.ReactNode | ExtendedMessageDescriptor,
): message is ExtendedMessageDescriptor => {
    return (
        typeof message === 'object' &&
        message !== null &&
        (message as ExtendedMessageDescriptor).defaultMessage !== undefined
    );
};

export const isMsgType = (props: MsgType | ChildrenType): props is MsgType => {
    return (
        typeof props === 'object' &&
        props !== null &&
        (props as MsgType).defaultMessage !== undefined
    );
};

export const isChildrenType = (props: MsgType | ChildrenType): props is ChildrenType => {
    return typeof props === 'object' && props !== null && props.children !== null;
};

interface ChildrenType {
    children: React.ReactChild | ExtendedMessageDescriptor;
}

interface MsgType extends ExtendedMessageDescriptor {
    children?: undefined;
}

type PrimitiveType = string | number | boolean | Date | null | undefined;

/**
 * Util component that helps with rendering react-intl messages.
 * It extends the FormattedMessage API and adds prop 'children' (ReactNode or MessageDescriptor).
 * The standard way of using it is by passing all necessary props (id, defaultMessage) to the component (eg. by spreading message obj)
 * The alternative is to pass whole (Extended)MessageDescriptor object as a children.
 * If children prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage with the message. Otherwise it just simply render passed children.
 */
const Translation = (props: ChildrenType | MsgType) => {
    const values: Record<string, PrimitiveType | React.ReactNode> = {};
    // message passed via props (id, defaultMessage, values)
    if (isMsgType(props)) {
        Object.keys(props.values || []).forEach(key => {
            // Iterates through all values. The entry may also contain a MessageDescriptor.
            // Renders MessageDescriptor by passing it to `Translation` component
            // It also works for string values as 'Translation' just renders its children in case the children is not MessageDescriptor
            values[key] = <Translation>{props.values![key]}</Translation>;
        });

        // pass undefined to a 'values' prop in case of an empty values object
        return (
            <FormattedMessage
                {...props}
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        );
    }
    // Passed children prop (ExtendedMessageDescriptor obj)
    // Basically same logic as for MsgType
    if (isChildrenType(props) && isChildrenMessageDescriptor(props.children)) {
        Object.keys(props.children.values || []).forEach(key => {
            // @ts-ignore
            values[key] = <Translation>{props.children.values[key]}</Translation>;
        });

        return (
            <FormattedMessage
                {...props.children}
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        );
    }

    // passed children prop (regular ReactChild, not ExtendedMessageDescriptor)
    return <>{props.children}</>;
};

export { Translation };
