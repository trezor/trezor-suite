import { type CTA, type Localization } from '@suite-common/suite-types';
import { Link } from '@suite-native/link';
import { type TypographyStyle } from '@trezor/theme';

type MessageLinkProps = {
    messageCTA?: CTA;
    language: keyof Localization;
    textVariant?: TypographyStyle;
};
export const MessageLink = ({
    messageCTA,
    language,
    textVariant = 'body-sm',
}: MessageLinkProps) => {
    const messageLinkLabel = messageCTA?.label[language];
    const messageLink = messageCTA?.link;
    const isExternalLink = messageCTA?.action === 'external-link';

    const isLinkDisplayable = isExternalLink && messageLinkLabel && messageLink;

    if (!isLinkDisplayable) return null;

    return (
        <Link
            href={messageLink}
            label={messageLinkLabel}
            isUnderlined
            textColor="textDefault"
            textPressedColor="textSubdued"
            textVariant={textVariant}
        />
    );
};
