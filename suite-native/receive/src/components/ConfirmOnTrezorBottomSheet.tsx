import { BottomSheet, Button, VStack, Box } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

export const ConfirmOnTrezorBottomSheet = ({
    isOpened,
    onClose,
}: {
    isOpened: boolean;
    onClose: () => void;
}) => {
    const { translate } = useTranslate();
    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="large"
        >
            <VStack spacing="large">
                <ReceiveAddressBottomSheetHeader
                    title={translate('moduleReceive.bottomSheets.confirmOnTrezor.title')}
                    description={translate(
                        'moduleReceive.bottomSheets.confirmOnTrezor.description',
                    )}
                />
                <Box flex={1}>
                    <Button onPress={onClose}>{translate('generic.buttons.close')}</Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
