import { CTA } from '@suite-common/suite-types';
import { useOpenLink } from '@suite-native/link';
type Props = {
    messageCTA?: CTA;
    language: string;
};
export const useHandleMessageLink = ({ messageCTA, language }: Props) => {
    const messageLinkLabel = messageCTA?.label[language];
    const messageLink = messageCTA?.link;
    const isExternalLink = messageCTA?.action === 'external-link';
    const handleOpenLink = useOpenLink();

    const isLinkDisplayable = isExternalLink && messageLinkLabel && messageLink;

    const handleLinkPress = () => {
        if (!isLinkDisplayable) return null;
        handleOpenLink(messageLink);
    };

    return { handleLinkPress, linkLabel: messageLinkLabel };
};
