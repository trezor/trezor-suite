import { type JSX, type ReactNode } from 'react';

import { type ExtendedMessageDescriptor } from '@suite/intl';
import { Paragraph } from '@trezor/components';

import type { NotificationRendererProps } from 'src/components/suite';

import { type NotificationAction } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type ConditionalActionRendererProps = NotificationRendererProps & {
    header: ReactNode;
    body: ReactNode;
    icon?: JSX.Element;
    actionLabel: ExtendedMessageDescriptor['id'];
    actionAllowed: boolean;
    onAction: () => void;
    onCancel: () => void;
};

export const ConditionalActionRenderer = ({
    header,
    body,
    actionAllowed,
    actionLabel,
    onAction,
    onCancel,
    render: View,
    ...rest
}: ConditionalActionRendererProps) => {
    const actions: NotificationAction[] = [
        { onClick: onAction, label: actionLabel, position: 'bottom', intent: 'brand' },
        { onClick: onCancel, label: 'TR_CANCEL', position: 'bottom', priority: 'secondary' },
    ];

    return (
        <View
            {...rest}
            variant="transparent"
            message="TOAST_COIN_SCHEME_PROTOCOL"
            messageValues={{
                header: (
                    <Paragraph typographyStyle="body-md-strong" margin={{ top: 2 }}>
                        {header}
                    </Paragraph>
                ),
                body: (
                    <Paragraph typographyStyle="body-md" margin={{ top: 2 }}>
                        {body}
                    </Paragraph>
                ),
            }}
            action={actions}
            onCancel={onCancel}
        />
    );
};
