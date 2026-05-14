import { type ReactNode } from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
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
                <Text textAlign="center" variant="headline-sm">
                    <Translation id="moduleDevice.confirmOnDeviceSheetTitle" />
                </Text>
                <Text textAlign="center" color="contentSecondary">
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
