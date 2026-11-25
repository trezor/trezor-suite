import { Button } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

type CopyLinkButtonProps = {
    link: string;
};

export const CopyLinkButton = ({ link }: CopyLinkButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    return (
        <Button iconLeft="copySimple" intent="neutral" onPress={() => copyToClipboard(link)}>
            <Translation id="referAFriend.buttons.copyLink" />
        </Button>
    );
};
