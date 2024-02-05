import { BottomSheet, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Video, VideoName } from '@suite-native/video-assets';
import { NetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { Translation, TxKeyPath, useTranslate } from '@suite-native/intl';

type XpubHintBottomSheetProps = {
    networkType: NetworkType;
    isVisible: boolean;
    handleClose: () => void;
};

export const XpubHintBottomSheet = ({
    networkType,
    isVisible,
    handleClose,
}: XpubHintBottomSheetProps) => {
    const { translate } = useTranslate();
    const isAddressBased = isAddressBasedNetwork(networkType);
    const video: VideoName = isAddressBased ? 'xpubImportBTC' : 'xpubImportETH';
    const title = isAddressBased
        ? translate('moduleAccountImport.xpubScanScreen.hintBottomSheet.title.address')
        : translate('moduleAccountImport.xpubScanScreen.hintBottomSheet.title.xpub');

    const textTranslationTag: TxKeyPath = isAddressBased
        ? 'moduleAccountImport.xpubScanScreen.hintBottomSheet.text.address'
        : 'moduleAccountImport.xpubScanScreen.hintBottomSheet.text.xpub';

    return (
        <BottomSheet title={title} isVisible={isVisible} onClose={handleClose}>
            <Box paddingTop="small" justifyContent="space-between">
                <Video name={video} aspectRatio={1} />
                <VStack spacing="large" paddingTop="large">
                    <Text color="textSubdued" textAlign="center" variant="hint">
                        <Translation
                            id={textTranslationTag}
                            values={{
                                emphasized: chunks => (
                                    <Text color="textDefault" variant="hint">
                                        {chunks}
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                </VStack>
                <Box marginTop="extraLarge">
                    <Button
                        data-testID="@accounts-import/xpub-help-modal/confirm-btn"
                        onPress={handleClose}
                    >
                        {translate('moduleAccountImport.xpubScanScreen.confirmButton')}
                    </Button>
                </Box>
            </Box>
        </BottomSheet>
    );
};
