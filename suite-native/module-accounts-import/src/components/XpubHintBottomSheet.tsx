import { type NetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Video, type VideoName } from '@suite-native/video-assets';

type XpubHintBottomSheetProps = {
    networkType: NetworkType;
    handleClose: () => void;
    ref: BottomSheetModalRef;
};

export const XpubHintBottomSheet = ({
    networkType,
    handleClose,
    ref,
}: XpubHintBottomSheetProps) => {
    const isAddressBased = isAddressBasedNetwork(networkType);
    const video: VideoName = isAddressBased ? 'xpubImportETH' : 'xpubImportBTC';
    const title = (
        <Translation
            id={
                isAddressBased
                    ? 'moduleAccountImport.xpubScanScreen.hintBottomSheet.title.address'
                    : 'moduleAccountImport.xpubScanScreen.hintBottomSheet.title.xpub'
            }
        />
    );

    const textTranslationTag: TxKeyPath = isAddressBased
        ? 'moduleAccountImport.xpubScanScreen.hintBottomSheet.text.address'
        : 'moduleAccountImport.xpubScanScreen.hintBottomSheet.text.xpub';

    return (
        <BottomSheetModal title={title} ref={ref} isCloseDisplayed>
            <Box paddingTop="sp8" justifyContent="space-between">
                <Video name={video} aspectRatio={1} />
                <VStack spacing="sp24" paddingTop="sp24">
                    <Text color="textSubdued" textAlign="center" variant="body-sm">
                        <Translation
                            id={textTranslationTag}
                            values={{
                                emphasized: chunks => (
                                    <Text color="textDefault" variant="body-sm">
                                        {chunks}
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                </VStack>
                <Box marginTop="sp32">
                    <Button
                        testID="@accounts-import/xpub-help-modal/confirm-btn"
                        onPress={handleClose}
                    >
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </Box>
            </Box>
        </BottomSheetModal>
    );
};
