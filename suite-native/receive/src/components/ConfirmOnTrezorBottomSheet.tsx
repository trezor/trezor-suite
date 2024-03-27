import { BottomSheet, Button, VStack, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

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
                <ReceiveAddressBottomSheetHeader
                    title={<Translation id="moduleReceive.bottomSheets.confirmOnTrezor.title" />}
                    description={
                        <Translation id="moduleReceive.bottomSheets.confirmOnTrezor.description" />
                    }
                />
                <Box flex={1}>
                    <Button onPress={onClose}>
                        <Translation id="generic.buttons.close" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
