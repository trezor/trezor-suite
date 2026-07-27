import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ConfirmBottomSheetProps = {
    ref: BottomSheetModalRef;
    onConfirm: () => void;
    onCheckBackup: () => void;
};

export const ConfirmBottomSheet = ({ ref, onConfirm, onCheckBackup }: ConfirmBottomSheetProps) => (
    <BottomSheetModal ref={ref}>
        <VStack spacing="sp24" marginHorizontal="sp8" marginTop="sp4">
            <VStack spacing="sp8">
                <Text textAlign="center" variant="headline-sm">
                    <Translation id="firmware.seedBottomSheet.title" />
                </Text>
                <Text textAlign="center">
                    <Translation id="firmware.seedBottomSheet.description" />
                </Text>
            </VStack>
            <VStack spacing="sp12">
                <Button onPress={onConfirm} testID="@device-firmware/sheet/continue">
                    <Translation id="firmware.seedBottomSheet.continueButton" />
                </Button>
                <Button
                    testID="@device-firmware/sheet/check-backup"
                    onPress={onCheckBackup}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="firmware.seedBottomSheet.checkBackupButton" />
                </Button>
            </VStack>
        </VStack>
    </BottomSheetModal>
);
