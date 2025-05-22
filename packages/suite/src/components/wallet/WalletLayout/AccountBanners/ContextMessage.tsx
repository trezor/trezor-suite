import { useMemo } from 'react';

import {
    Context,
    messageSystemActions,
    selectContextMessageContent,
} from '@suite-common/message-system';
import { Banner, Row } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLanguage, selectTorState } from 'src/reducers/suite/suiteReducer';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';

type ContextMessageProps = {
    context: (typeof Context)[keyof typeof Context];
};

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectContextMessageContent(state, context, language));
    const { isTorEnabled } = useSelector(selectTorState);
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);
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
                  () => dispatch(goto(link, { anchor, preserveParams: true }))
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
            variant={message.variant === 'critical' ? 'destructive' : message.variant}
            rightContent={
                <Row gap={8}>
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
                            isSubtle
                            data-testid={dismissalConfig['data-testid']}
                        />
                    )}
                </Row>
            }
        >
            {message.content}
        </Banner>
    );
};
