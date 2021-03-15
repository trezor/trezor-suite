import * as React from 'react';

import * as routerActions from '@suite-actions/routerActions';
import * as messageSystemActions from '@suite-actions/messageSystemActions';
import { useActions } from '@suite-hooks';
import { Notification } from '@suite/types/suite/messageSystem';
import Wrapper from './components/Wrapper';

type Props = {
    notification: Notification;
};

const MessageSystemBanner = ({ notification }: Props) => {
    const { cta, variant, id, message, dismissible } = notification;

    const { goto, dismissNotification } = useActions({
        goto: routerActions.goto,
        dismissNotification: messageSystemActions.dismissNotification,
    });

    const getActionConfig = () => {
        if (!cta) return undefined;

        const { action, label, href } = cta;

        let onClick: () => Window | Promise<void> | null;
        if (action === 'internal-link') {
            // @ts-ignore: impossible to add all href options to the message system config json schema
            onClick = () => goto(href);
        } else if (action === 'external-link') {
            onClick = () => window.open(href, '_blank');
        }

        return {
            label: label['en-GB'],
            onClick: onClick!,
            'data-test': `@notification/message-system/${id}/cta`,
        };
    };

    const getDismissalConfig = () => {
        if (!dismissible) return undefined;

        return {
            onClick: () => dismissNotification(id, 'banner'),
            'data-test': `@notification/message-system/${id}/dismiss`,
        };
    };

    const actionConfig = getActionConfig();
    const dismissalConfig = getDismissalConfig();

    return (
        <Wrapper
            variant={variant}
            body={message['en-GB']}
            action={actionConfig}
            dismissal={dismissalConfig}
        />
    );
};

export default MessageSystemBanner;
