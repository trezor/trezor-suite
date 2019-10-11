import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Notification, NotificationProps } from '@trezor/components';

// Add MessageDescriptor type to values entry
interface ExtendedMessageDescriptor extends FormattedMessage.MessageDescriptor {
    values?: {
        [key: string]:
            | React.ReactNode // Original values type
            | FormattedMessage.MessageDescriptor;
    };
}

// add additional type 'MessageDescriptor' to label to CTA object
type CTAShape = Required<NotificationProps>['actions'][number] & {
    label: React.ReactNode | ExtendedMessageDescriptor;
};

interface Props extends NotificationProps {
    title: React.ReactNode | ExtendedMessageDescriptor;
    message?: React.ReactNode | ExtendedMessageDescriptor;
    actions?: CTAShape[];
}

const getFormattedMessage = (message: React.ReactNode | ExtendedMessageDescriptor) => {
    // assume message type is ExtendedMessageDescriptor
    if (typeof message === 'object' && message !== null) {
        const values: Required<ExtendedMessageDescriptor>['values'] = {};
        if ('values' in message && message.values) {
            // Message with variables passed via 'values' prop.
            // Value entry can also contain a MessageDescriptor.
            // Copy values and extract necessary messages to a new 'values' object
            Object.keys(message.values).forEach(key => {
                values[key] = getFormattedMessage(
                    (message as ExtendedMessageDescriptor).values![key],
                );
            });
        }

        // pass undefined to a 'values' prop in case of an empty values object
        return (
            <FormattedMessage
                {...(message as ExtendedMessageDescriptor)}
                values={
                    Object.keys(values).length === 0
                        ? undefined
                        : (values as FormattedMessage.Props['values'])
                }
            />
        );
    }
    return message;
};

/**
 * Wrapper around @trezor/component Notification with support for react-intl messages.
 * If title, message or callback's label prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage instead of originally passed prop.
 */
const NotificationWithIntl = (props: Props) => {
    return (
        <Notification
            {...props}
            title={getFormattedMessage(props.title)}
            message={getFormattedMessage(props.message)}
            actions={
                props.actions
                    ? props.actions.map(a => ({
                          ...a,
                          label: getFormattedMessage(a.label),
                      }))
                    : undefined
            }
        />
    );
};

export default NotificationWithIntl;
