import React from 'react';
import { Notification, NotificationProps } from '@trezor/components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Translation } from '../Intl';

// add additional type 'MessageDescriptor' to label to CTA object
type CTAShape = Required<NotificationProps>['actions'][number] & {
    label: React.ReactNode | ExtendedMessageDescriptor;
};

export interface Props extends NotificationProps {
    title: React.ReactNode | ExtendedMessageDescriptor;
    message?: React.ReactNode | ExtendedMessageDescriptor;
    actions?: CTAShape[];
}

/**
 * Wrapper around @trezor/component Notification with support for react-intl messages.
 * If title, message or callback's label prop is an object, it assumes that it is ExtendedMessageDescriptor
 * and renders FormattedMessage instead of originally passed prop.
 */
const NotificationWithIntl = (props: Props) => {
    return (
        <Notification
            {...props}
            title={<Translation>{props.title}</Translation>}
            message={<Translation>{props.message}</Translation>}
            actions={
                props.actions
                    ? props.actions.map(a => ({
                          ...a,
                          label: <Translation>{a.label}</Translation>,
                      }))
                    : undefined
            }
        />
    );
};

export default NotificationWithIntl;
