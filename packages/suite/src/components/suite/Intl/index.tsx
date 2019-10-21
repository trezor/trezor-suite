import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ExtendedMessageDescriptor } from '@suite-types';

export const isMessageDescriptor = (
    message: React.ReactNode | ExtendedMessageDescriptor,
): message is ExtendedMessageDescriptor => {
    return (
        typeof message === 'object' &&
        message !== null &&
        (message as ExtendedMessageDescriptor).defaultMessage !== undefined
    );
};

interface Props {
    children: React.ReactNode | ExtendedMessageDescriptor;
}

/**
 * Util component that helps with rendering react-intl messages.
 * If children prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage instead of originally passed prop.
 */
const Intl = ({ children }: Props) => {
    if (isMessageDescriptor(children)) {
        const values: any = {};
        if (children.values) {
            // Message with variables passed via 'values' prop.
            // Value entry can also contain a MessageDescriptor.
            // Copy values and extract necessary messages to a new 'values' object
            Object.keys(children.values).forEach(key => {
                values[key] = <Intl>{children.values![key]}</Intl>;
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
    return <>{children}</>;
};

export { Intl as Translation };
