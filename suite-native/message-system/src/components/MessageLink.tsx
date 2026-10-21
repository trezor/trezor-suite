import { resolveMessageContent } from '@suite-common/message-system';
import { type CTA } from '@suite-common/suite-types';
import { Link } from '@suite-native/link';
import { type TypographyStyle } from '@trezor/theme';

import { canHandleCtaAction } from '../utils/canHandleCtaAction';

type MessageLinkProps = {
    messageCTA?: CTA;
    language: string;
    textVariant?: TypographyStyle;
};
export const MessageLink = ({
    messageCTA,
    language,
    textVariant = 'body-sm',
}: MessageLinkProps) => {
    const canHandleLinkAction = canHandleCtaAction(messageCTA, language);

    if (!canHandleLinkAction) {
        return null;
    }

    return (
        <Link
            href={messageCTA.link}
            label={resolveMessageContent(messageCTA.label, language)}
            isUnderlined
            textColor="contentPrimary"
            textPressedColor="contentSecondary"
            textVariant={textVariant}
        />
    );
};
