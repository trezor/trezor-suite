import { BottomSheet, Button, VStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ConfirmOnTrezorBottomSheet = ({
    isOpened,
    onClose,
}: {
    isOpened: boolean;
    onClose: () => void;
}) => {
    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="large"
        >
            <VStack spacing="large">
                <VStack alignItems="center">
                    <Text textAlign="center" variant="titleSmall">
                        <Translation id="moduleReceive.bottomSheets.confirmOnTrezor.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="moduleReceive.bottomSheets.confirmOnTrezor.description" />
                    </Text>
                </VStack>

                <Box flex={1}>
                    <Button onPress={onClose}>
                        <Translation id="generic.buttons.close" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
