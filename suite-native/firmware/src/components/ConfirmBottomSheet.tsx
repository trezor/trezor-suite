import { useMemo } from 'react';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, Button, Text, VStack } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation, TxKeyPath } from '@suite-native/intl';

type ConfirmBottomSheetProps = {
    ref: React.Ref<BottomSheetModalMethods>;
    onConfirm: () => void;
    onCheckBackup: () => void;
    onCancel: () => void;
};

export const ConfirmBottomSheet = ({
    ref,
    onConfirm,
    onCheckBackup,
    onCancel,
}: ConfirmBottomSheetProps) => {
    const isCheckBackupEnabled = useFeatureFlag(FeatureFlag.IsCheckBackupsEnabled);

    const translations = useMemo(() => {
        if (isCheckBackupEnabled) {
            return {
                title: 'firmware.seedBottomSheetWithCheckBackup.title',
                description: 'firmware.seedBottomSheetWithCheckBackup.description',
                primaryButton: 'firmware.seedBottomSheetWithCheckBackup.continueButton',
                secondaryButton: 'firmware.seedBottomSheetWithCheckBackup.checkBackupButton',
            };
        }

        return {
            title: 'firmware.seedBottomSheet.title',
            description: 'firmware.seedBottomSheet.description',
            primaryButton: 'firmware.seedBottomSheet.continueButton',
            secondaryButton: 'firmware.seedBottomSheet.closeButton',
        };
    }, [isCheckBackupEnabled]) satisfies Record<string, TxKeyPath>;

    return (
        <BottomSheetModal ref={ref}>
            <VStack spacing="sp24" marginHorizontal="sp8" marginTop="sp4">
                <VStack spacing="sp8">
                    <Text textAlign="center" variant="titleSmall">
                        <Translation id={translations.title} />
                    </Text>
                    <Text textAlign="center">
                        <Translation id={translations.description} />
                    </Text>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        size="medium"
                        onPress={onConfirm}
                        testID="@device-firmware/sheet/continue"
                    >
                        <Translation id={translations.primaryButton} />
                    </Button>
                    <Button
                        testID="@device-firmware/sheet/check-backup"
                        onPress={isCheckBackupEnabled ? onCheckBackup : onCancel}
                        size="medium"
                        colorScheme="tertiaryElevation1"
                    >
                        <Translation id={translations.secondaryButton} />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheetModal>
    );
};
