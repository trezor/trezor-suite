import { useMemo } from 'react';

import { goto } from '@suite/router';
import {
    ContextDomain,
    messageSystemActions,
    selectContextMessageContent,
} from '@suite-common/message-system';
import { Banner } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectLanguage,
    selectTorOnionLinks,
    selectTorState,
} from 'src/selectors/suite/suiteSelectors';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';

type ContextMessageProps = {
    context: ContextDomain;
};

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectContextMessageContent(state, context, language));
    const { isTorEnabled } = useSelector(selectTorState);
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
                ? // @ts-expect-error: impossible to add all href options to the message system config json schema
                  () => dispatch(goto({ routeName: link, anchor, preserveParams: true }))
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
                            onClick={actionConfig?.onClick}
                            data-testid={actionConfig['data-testid']}
                        >
                            {actionConfig.label}
                        </Banner.Button>
                    )}
                    {dismissalConfig && (
                        <Banner.IconButton
                            icon="x"
                            onClick={dismissalConfig.onClick}
                            priority="secondary"
                            data-testid={dismissalConfig['data-testid']}
                        />
                    )}
                </>
            }
            description={message.content}
        />
    );
};
