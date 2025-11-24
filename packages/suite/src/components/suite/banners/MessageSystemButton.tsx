import { resolveMessageContent } from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { Banner, ButtonProps } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectLanguage,
    selectTorOnionLinks,
    selectTorState,
} from 'src/selectors/suite/suiteSelectors';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';

type MessageSystemButtonProps = {
    cta?: Message['cta'];
    id?: Message['id'];
} & Pick<ButtonProps, 'iconLeft' | 'iconRight' | 'size'>;

export const MessageSystemButton = ({ cta, id, ...props }: MessageSystemButtonProps) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const language = useSelector(selectLanguage);
    const torOnionLinks = useSelector(selectTorOnionLinks);
    const dispatch = useDispatch();

    if (!cta) return null;

    const { action, label, link, anchor } = cta;

    const onClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.stopPropagation();
        switch (action) {
            case 'internal-link':
                // @ts-expect-error: impossible to add all href options to the message system config json schema
                dispatch(goto(link as Route['name'], { anchor, preserveParams: true }));
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
            onClick={onClick!}
            {...(id ? { 'data-testid': `@message-system/${id}/cta` } : {})}
            {...props}
        >
            {resolvedLabel}
        </Banner.Button>
    );
};
