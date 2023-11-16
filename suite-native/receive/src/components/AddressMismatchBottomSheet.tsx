import { BottomSheet, Button, VStack, Box, Text, BulletListItem } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
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
    const { translate } = useTranslate();

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
                    title={translate('moduleReceive.bottomSheets.addressMismatch.title')}
                    description={translate(
                        'moduleReceive.bottomSheets.addressMismatch.description',
                    )}
                />

                <VStack spacing="small">
                    <Text variant="callout">
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.remember" />
                    </Text>
                    <BulletListItem color="textSubdued">
                        {translate('moduleReceive.bottomSheets.addressMismatch.trustDevice')}
                    </BulletListItem>
                    <BulletListItem color="textSubdued">
                        {translate('moduleReceive.bottomSheets.addressMismatch.contactSupport')}
                    </BulletListItem>
                </VStack>

                <Box flex={1}>
                    <VStack spacing="medium">
                        <Button
                            iconLeft="warningTriangle"
                            colorScheme="tertiaryElevation0"
                            onPress={handleOpenSupportLink}
                        >
                            {translate(
                                'moduleReceive.bottomSheets.addressMismatch.reportIssueButton',
                            )}
                        </Button>
                        <Button onPress={onClose}>{translate('generic.buttons.close')}</Button>
                    </VStack>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
