import { ReactNode } from 'react';

import { BottomSheet, Button, VStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ConfirmOnTrezorBottomSheetProps = {
    isOpened: boolean;
    onClose: () => void;
    text: ReactNode;
};

export const ConfirmOnTrezorBottomSheet = ({
    isOpened,
    onClose,
    text,
}: ConfirmOnTrezorBottomSheetProps) => {
    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="sp24"
        >
            <VStack spacing="sp24">
                <VStack alignItems="center">
                    <Text textAlign="center" variant="titleSmall">
                        <Translation id="moduleDevice.confirmOnDeviceSheetTitle" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        {text}
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
