import {
    BottomSheetModal,
    Box,
    Button,
    IconButton,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ThpPairingInfoHelpButton = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <Box>
            <IconButton
                intent="neutral"
                priority="secondary"
                iconName="question"
                onPress={openModal}
            />
            <BottomSheetModal ref={bottomSheetRef} isCloseDisplayed={false}>
                <VStack spacing="sp24">
                    <VStack spacing="sp8">
                        <Text variant="headline-sm" color="textDefault">
                            <Translation id="thp.pairingInfo.help.title" />
                        </Text>
                        <Text>
                            <Translation id="thp.pairingInfo.help.description" />
                        </Text>
                    </VStack>
                    <Button onPress={closeModal}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </Box>
    );
};
