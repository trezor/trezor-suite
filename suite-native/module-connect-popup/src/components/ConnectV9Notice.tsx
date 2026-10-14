import { useSelector } from 'react-redux';

import { type ConnectCallSource, isConnectV9Source } from '@suite-common/connect-popup';
import {
    Feature,
    type MessageSystemRootState,
    resolveMessageContent,
    selectFeatureConfig,
    selectFeatureMessage,
} from '@suite-common/message-system';
import { BannerInline } from '@suite-native/atoms';
import { selectLocale } from '@suite-native/intl';
import { Link } from '@suite-native/link';

type ConnectV9NoticeProps = {
    source: ConnectCallSource;
};

export const ConnectV9Notice = ({ source }: ConnectV9NoticeProps) => {
    const locale = useSelector(selectLocale);
    const message = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessage(state, Feature.connectV9.warning),
    );
    // Not selectIsFeatureEnabled: it reads a domain that is missing from the config as enabled.
    const isEnabled = useSelector(
        (state: MessageSystemRootState) =>
            selectFeatureConfig(state, Feature.connectV9.warning)?.flag === true,
    );

    if (!message || !isEnabled || !isConnectV9Source(source)) return null;

    // An empty translation is returned as is, so fall back to English like the message banners do.
    const content =
        resolveMessageContent(message.content, locale).trim() || message.content.en.trim();

    if (!content) return null;

    const { cta } = message;
    // An internal link of the config leads to a Suite desktop route, so only an external one is
    // shown.
    const isLinkShown = cta?.action === 'external-link';

    return (
        <BannerInline
            intent={message.variant}
            title={
                <>
                    {content}
                    {isLinkShown && (
                        <>
                            {' '}
                            <Link
                                label={resolveMessageContent(cta.label, locale) || cta.label.en}
                                href={cta.link}
                                isUnderlined
                                textVariant="body-sm"
                                textColor="contentPrimary"
                                textPressedColor="contentSecondary"
                            />
                        </>
                    )}
                </>
            }
            testID="@popup/connect-v9-notice"
        />
    );
};
