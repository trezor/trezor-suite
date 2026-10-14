import { MessageSystemButton } from '@suite/message-system';
import { selectLanguage } from '@suite/settings';
import { type ConnectCallSource, isConnectV9Source } from '@suite-common/connect-popup';
import {
    Feature,
    resolveMessageContent,
    selectFeatureConfig,
    selectFeatureMessage,
} from '@suite-common/message-system';
import { Banner } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type ConnectV9NoticeProps = {
    source: ConnectCallSource;
};

export const ConnectV9Notice = ({ source }: ConnectV9NoticeProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectFeatureMessage(state, Feature.connectV9.warning));
    // Not selectIsFeatureEnabled: it reads a domain that is missing from the config as enabled.
    const isEnabled = useSelector(
        state => selectFeatureConfig(state, Feature.connectV9.warning)?.flag === true,
    );

    if (!message || !isEnabled || !isConnectV9Source(source)) return null;

    // An empty translation is returned as is, so fall back to English like the message banners do.
    const content =
        resolveMessageContent(message.content, language).trim() || message.content.en.trim();

    if (!content) return null;

    return (
        <Banner
            icon
            intent={message.variant}
            description={content}
            rightContent={message.cta && <MessageSystemButton cta={message.cta} id={message.id} />}
            data-testid="@connect-permissions-modal/connect-v9-notice"
        />
    );
};
