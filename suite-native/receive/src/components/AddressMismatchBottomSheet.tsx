import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    BulletListItem,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL } from '@trezor/urls';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

type AddressMismatchBottomSheetProps = {
    onClose: () => void;
    ref: BottomSheetModalRef;
};

export const AddressMismatchBottomSheet = ({ onClose, ref }: AddressMismatchBottomSheetProps) => {
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink(HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL);

    return (
        <BottomSheetModal ref={ref} paddingHorizontal="sp24">
            <VStack spacing="sp24">
                <ReceiveAddressBottomSheetHeader
                    title={<Translation id="moduleReceive.bottomSheets.addressMismatch.title" />}
                    description={
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.description" />
                    }
                />

                <VStack spacing="sp8">
                    <Text variant="body-sm-strong">
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
                    <VStack spacing="sp16">
                        <Button
                            iconLeft="warning"
                            intent="neutral"
                            priority="secondary"
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
        </BottomSheetModal>
    );
};
