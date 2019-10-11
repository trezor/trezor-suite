import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Notification, NotificationProps } from '@trezor/components';

// add additional type 'MessageDescriptor' to label to CTA object
type CTAShape = Required<NotificationProps>['actions'][number] & {
    label: React.ReactNode | FormattedMessage.MessageDescriptor;
};

interface Props extends NotificationProps {
    title: NotificationProps['title'] | FormattedMessage.MessageDescriptor;
    message?: NotificationProps['message'] | FormattedMessage.MessageDescriptor;
    callback?: CTAShape[];
}

const getFormattedMessage = (message: React.ReactNode | FormattedMessage.MessageDescriptor) => {
    if (typeof message === 'object' && message !== null) {
        return <FormattedMessage {...(message as FormattedMessage.MessageDescriptor)} />;
    }
    return message;
};
/**
 * Wrapper around @trezor/component Notification with support for react-intl messages.
 * If title, message or callback's label prop is an object, it assumes that it is MessageDescriptor
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
