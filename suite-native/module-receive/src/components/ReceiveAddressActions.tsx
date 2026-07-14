import { Alert, Share } from 'react-native';

import { Button, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation, useTranslate } from '@suite-native/intl';

type ReceiveAddressActionsProps = {
    address: string;
};

export const ReceiveAddressActions = ({ address }: ReceiveAddressActionsProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();

    const handleCopyAddress = async () => {
        await copyToClipboard(address, translate('qrCode.addressCopied'));
    };

    const handleShareData = async () => {
        try {
            await Share.share({
                message: address,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    return (
        <VStack spacing="sp8">
            <Button iconLeft="copy" onPress={handleCopyAddress} isFullWidth>
                <Translation id="qrCode.copyButton" />
            </Button>
            <Button
                iconLeft="shareNetwork"
                intent="neutral"
                priority="secondary"
                onPress={handleShareData}
                isFullWidth
            >
                <Translation id="qrCode.shareButton" />
            </Button>
        </VStack>
    );
};
