import {
    BottomSheetModal,
    Box,
    Button,
    InlineAlertBox,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type DoNotCloseAppBottomSheetTriggerProps = {
    isTriggerDisplayed: boolean;
};

export const DoNotCloseAppBottomSheetTrigger = ({
    isTriggerDisplayed,
}: DoNotCloseAppBottomSheetTriggerProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            {isTriggerDisplayed && (
                <Box marginBottom="sp32" alignItems="center" justifyContent="center">
                    <InlineAlertBox
                        variant="info"
                        title={
                            <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alertBox.title" />
                        }
                        buttonLabel={
                            <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alertBox.button" />
                        }
                        onButtonPress={openModal}
                    />
                </Box>
            )}
            <BottomSheetModal ref={bottomSheetRef} paddingHorizontal="sp24">
                <VStack spacing="sp24" paddingBottom="sp24">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alert.title" />
                    </Text>

                    <Button onPress={closeModal} colorScheme="blueBold">
                        <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alert.button" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </>
    );
};
