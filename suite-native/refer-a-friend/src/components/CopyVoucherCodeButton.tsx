import { Button } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

type CopyVoucherCodeButtonProps = {
    code: string;
};

export const CopyVoucherCodeButton = ({ code }: CopyVoucherCodeButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    return (
        <Button iconLeft="copySimple" onPress={() => copyToClipboard(code)}>
            <Translation id="referAFriend.buttons.copyVoucherCode" />
        </Button>
    );
};
