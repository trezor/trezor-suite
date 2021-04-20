import React, { useMemo } from 'react';

import * as routerActions from '@suite-actions/routerActions';
import * as messageSystemActions from '@suite-actions/messageSystemActions';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';

import type { Message } from '@suite-types/messageSystem';

type Props = {
    message: Message;
};

const MessageSystemBanner = ({ message }: Props) => {
    const { cta, variant, id, content, dismissible } = message;

    const { goto, dismissNotification } = useActions({
        goto: routerActions.goto,
        dismissNotification: messageSystemActions.dismissMessage,
    });

    const actionConfig = useMemo(() => {
        if (!cta) return undefined;

        const { action, label, link } = cta;

        let onClick: () => Window | Promise<void> | null;
        if (action === 'internal-link') {
            // @ts-ignore: impossible to add all href options to the message system config json schema
            onClick = () => goto(link);
        } else if (action === 'external-link') {
            onClick = () => window.open(link, '_blank');
        }

        return {
            label: label['en-GB'], // TODO: wait for multilingual suite and solve translations
            onClick: onClick!,
            'data-test': `@message-system/${id}/cta`,
        };
    }, [id, cta, goto]);

    const dismissalConfig = useMemo(() => {
        if (!dismissible) return undefined;

        return {
            onClick: () => dismissNotification(id, 'banner'),
            'data-test': `@message-system/${id}/dismiss`,
        };
    }, [id, dismissible, dismissNotification]);

    return (
        <Wrapper
            variant={variant}
            body={content['en-GB']} // TODO: wait for multilingual suite and solve translations
            action={actionConfig}
            dismissal={dismissalConfig}
        />
    );
};

export default MessageSystemBanner;
