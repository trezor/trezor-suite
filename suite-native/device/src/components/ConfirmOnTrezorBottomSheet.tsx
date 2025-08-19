import { ReactNode } from 'react';

import {
    BottomSheetModal,
    BottomSheetModalRef,
    Box,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ConfirmOnTrezorBottomSheetProps = {
    onClose: () => void;
    text: ReactNode;
    ref: BottomSheetModalRef;
};

export const ConfirmOnTrezorBottomSheet = ({
    onClose,
    text,
    ref,
}: ConfirmOnTrezorBottomSheetProps) => (
    <BottomSheetModal ref={ref} paddingHorizontal="sp24">
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
    </BottomSheetModal>
);
