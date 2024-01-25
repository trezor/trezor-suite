import { useMemo } from 'react';
import styled from 'styled-components';
import { zIndices } from '@trezor/theme';
import { goto } from 'src/actions/suite/routerActions';
import { messageSystemActions } from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';
import { Banner } from './Banner';

import { selectTorState } from 'src/reducers/suite/suiteReducer';

const BannerOnTop = styled(Banner)`
    position: relative;
    z-index: ${zIndices.guide};
`;

type MessageSystemBannerProps = {
    message: Message;
};

export const MessageSystemBanner = ({ message }: MessageSystemBannerProps) => {
    const { cta, variant, id, content, dismissible } = message;

    const { isTorEnabled } = useSelector(selectTorState);
    const language = useSelector(state => state.suite.settings.language);
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);
    const dispatch = useDispatch();

    const actionConfig = useMemo(() => {
        if (!cta) return undefined;

        const { action, label, link, anchor } = cta;

        let onClick: () => Window | Promise<void> | null;
        if (action === 'internal-link') {
            // @ts-expect-error: impossible to add all href options to the message system config json schema
            onClick = () => dispatch(goto(link, { anchor, preserveParams: true }));
        } else if (action === 'external-link') {
            onClick = () =>
                window.open(
                    isTorEnabled && torOnionLinks ? getTorUrlIfAvailable(link) : link,
                    '_blank',
                );
        }

        return {
            label: label[language] || label.en,
            onClick: onClick!,
            'data-test': `@message-system/${id}/cta`,
        };
    }, [id, cta, dispatch, language, isTorEnabled, torOnionLinks]);

    const dismissalConfig = useMemo(() => {
        if (!dismissible) return undefined;

        return {
            onClick: () =>
                dispatch(messageSystemActions.dismissMessage({ id, category: 'banner' })),
            'data-test': `@message-system/${id}/dismiss`,
        };
    }, [id, dismissible, dispatch]);

    return (
        <BannerOnTop
            variant={variant === 'critical' ? 'destructive' : variant}
            body={content[language] || content.en}
            action={actionConfig}
            dismissal={dismissalConfig}
        />
    );
};
