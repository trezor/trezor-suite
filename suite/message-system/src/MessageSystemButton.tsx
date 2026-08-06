import { useDispatch, useSelector } from 'react-redux';

import { getTorUrlIfAvailable } from '@suite/external-links';
import { type Route, goto } from '@suite/router';
import { selectLanguage, selectTorOnionLinks } from '@suite/settings';
import { selectIsTorEnabled } from '@suite/tor';
import { resolveMessageContent } from '@suite-common/message-system';
import { type Message } from '@suite-common/suite-types';
import { Banner, type ButtonProps } from '@trezor/components';

type MessageSystemButtonProps = {
    cta?: Message['cta'];
    id?: Message['id'];
} & Pick<ButtonProps, 'iconLeft' | 'iconRight' | 'size' | 'intent'>;

export const MessageSystemButton = ({ cta, id, ...props }: MessageSystemButtonProps) => {
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const language = useSelector(selectLanguage);
    const torOnionLinks = useSelector(selectTorOnionLinks);
    const dispatch = useDispatch();

    if (!cta) return null;

    const { action, label, link, anchor } = cta;

    const onClick = () => {
        switch (action) {
            case 'internal-link':
                dispatch(goto({ routeName: link as Route['name'], anchor, preserveParams: true }));
                break;
            case 'external-link':
                window.open(
                    isTorEnabled && torOnionLinks ? getTorUrlIfAvailable(link) : link,
                    '_blank',
                );
                break;
        }
    };

    const resolvedLabel = resolveMessageContent(label, language) || label.en;

    return (
        <Banner.Button
            onClick={onClick}
            priority="primary"
            {...(id ? { 'data-testid': `@message-system/${id}/cta` } : {})}
            {...props}
        >
            {resolvedLabel}
        </Banner.Button>
    );
};
