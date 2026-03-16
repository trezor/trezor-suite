import { useMemo } from 'react';

import { messageSystemActions, resolveMessageContent } from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { Banner, BannerProps } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { MessageSystemButton } from './MessageSystemButton';

type MessageSystemBannerProps = {
    message: Message;
    margin?: BannerProps['margin'];
    width?: BannerProps['width'];
};

export const MessageSystemBanner = ({ message, margin, width }: MessageSystemBannerProps) => {
    const { variant, id, content, dismissible, cta } = message;

    const language = useSelector(selectLanguage);

    const dispatch = useDispatch();

    const dismissalConfig = useMemo(() => {
        if (!dismissible) return undefined;

        return {
            onClick: () =>
                dispatch(messageSystemActions.dismissMessage({ id, category: 'banner' })),
            'data-testid': `@message-system/${id}/dismiss`,
        };
    }, [id, dismissible, dispatch]);

    return (
        <Banner
            icon
            intent={variant}
            rightContent={
                <>
                    <MessageSystemButton cta={cta} id={id} />
                    {dismissalConfig && (
                        <Banner.IconButton
                            icon="x"
                            onClick={e => {
                                e.stopPropagation();
                                dismissalConfig.onClick();
                            }}
                            priority="secondary"
                            data-testid={dismissalConfig['data-testid']}
                        />
                    )}
                </>
            }
            margin={margin}
            width={width}
            description={resolveMessageContent(content, language) || content.en}
        />
    );
};
