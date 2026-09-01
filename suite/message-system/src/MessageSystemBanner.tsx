import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { messageSystemActions, resolveMessageContent } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { type Message } from '@suite-common/suite-types';
import { Banner, type BannerProps } from '@trezor/components';
import { XIcon } from '@trezor/icons';

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
                            icon={XIcon}
                            onClick={dismissalConfig.onClick}
                            priority="secondary"
                            data-testid={dismissalConfig['data-testid']}
                            tooltip={{ content: <Translation id="TR_DISMISS" /> }}
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
