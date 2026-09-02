import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getTorUrlIfAvailable } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { selectLanguage, selectTorOnionLinks } from '@suite/settings';
import { selectIsTorEnabled } from '@suite/tor';
import {
    type ContextDomain,
    messageSystemActions,
    selectContextMessageContent,
} from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import type { MessageSystemSuiteWithTorRootState } from './messageSystemRootState';

type ContextMessageProps = {
    context: ContextDomain;
};

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector((state: MessageSystemSuiteWithTorRootState) =>
        selectContextMessageContent(state, context, language),
    );
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const torOnionLinks = useSelector(selectTorOnionLinks);
    const dispatch = useDispatch();

    const dismissalConfig = useMemo(() => {
        if (!message?.dismissible) return undefined;

        return {
            onClick: () =>
                dispatch(
                    messageSystemActions.dismissMessage({ id: message.id, category: 'context' }),
                ),
            'data-testid': `@message-system/${message.id}/dismiss`,
        };
    }, [message, dispatch]);

    const actionConfig = useMemo(() => {
        if (!message?.cta) return undefined;

        const { action, label, link, anchor } = message.cta;

        const onClick =
            action === 'internal-link'
                ? () =>
                      dispatch(
                          gotoThunk({
                              routeName: link as Route['name'],
                              anchor,
                              preserveParams: true,
                          }),
                      )
                : () =>
                      window.open(
                          isTorEnabled && torOnionLinks ? getTorUrlIfAvailable(link) : link,
                          '_blank',
                      );

        return {
            label,
            onClick,
            'data-testid': `@message-system/${message.id}/cta`,
        };
    }, [message, dispatch, isTorEnabled, torOnionLinks]);

    if (!message) return null;

    return (
        <Banner
            intent={message.variant}
            rightContent={
                <>
                    {actionConfig && (
                        <Banner.Button
                            onClick={actionConfig.onClick}
                            data-testid={actionConfig['data-testid']}
                        >
                            {actionConfig.label}
                        </Banner.Button>
                    )}
                    {dismissalConfig && (
                        <Banner.IconButton
                            icon={XIcon}
                            onClick={dismissalConfig.onClick}
                            priority="secondary"
                            data-testid={dismissalConfig['data-testid']}
                            tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                        />
                    )}
                </>
            }
            description={message.content}
        />
    );
};
