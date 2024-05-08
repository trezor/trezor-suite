import { BottomSheet, Button, VStack, Box, Text, BulletListItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

type AddressMismatchBottomSheetProps = {
    isOpened: boolean;
    onClose: () => void;
};

export const AddressMismatchBottomSheet = ({
    isOpened,
    onClose,
}: AddressMismatchBottomSheetProps) => {
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink('https://trezor.io/learn/c/trezor-suite-lite');

    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="large"
        >
            <VStack spacing="large">
                <ReceiveAddressBottomSheetHeader
                    title={<Translation id="moduleReceive.bottomSheets.addressMismatch.title" />}
                    description={
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.description" />
                    }
                />

                <VStack spacing="small">
                    <Text variant="callout">
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.remember" />
                    </Text>
                    <BulletListItem color="textSubdued">
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.trustDevice" />
                    </BulletListItem>
                    <BulletListItem color="textSubdued">
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.contactSupport" />
                    </BulletListItem>
                </VStack>

                <Box flex={1}>
                    <VStack spacing="medium">
                        <Button
                            viewLeft="warningTriangle"
                            colorScheme="tertiaryElevation0"
                            onPress={handleOpenSupportLink}
                        >
                            <Translation id="moduleReceive.bottomSheets.addressMismatch.reportIssueButton" />
                        </Button>
                        <Button onPress={onClose}>
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
