import { useState } from 'react';

import * as Haptics from 'expo-haptics';

import { type BackupType } from '@suite-common/suite-types';
import { BottomSheetModal, type BottomSheetModalRef, Button, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { WalletBackupCard } from './WalletBackupCard/WalletBackupCard';
import { WalletBackupSheetFooter } from './WalletBackupSheetFooter';

const legacyButtonStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginTop: utils.spacings.sp32,
}));

interface WalletBackupSheetProps {
    onCloseModal: () => void;
    selectedType: BackupType;
    onSelectType: (type: BackupType) => void;
    ref: BottomSheetModalRef;
}

const walletOptions = [
    'shamir-single',
    'shamir-advanced',
    '12-words',
    '24-words',
] as const satisfies BackupType[];

export const WalletBackupSheet = ({
    onSelectType,
    selectedType,
    ref,
    onCloseModal,
}: WalletBackupSheetProps) => {
    const [showLegacyOptions, setShowLegacyOptions] = useState(
        selectedType === '12-words' || selectedType === '24-words',
    );
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const displayLegacyOptions = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowLegacyOptions(true);
    };

    return (
        <BottomSheetModal
            title={translate('moduleDeviceOnboarding.walletBackupSheet.title')}
            ref={ref}
            footer={<WalletBackupSheetFooter selectedType={selectedType} onSubmit={onCloseModal} />}
            isCloseDisplayed
        >
            <VStack spacing="sp16">
                {walletOptions.map(type => {
                    const isSelected = type === selectedType;
                    const isVisible =
                        type === 'shamir-single' || type === 'shamir-advanced' || showLegacyOptions;

                    return (
                        <WalletBackupCard
                            key={type}
                            type={type}
                            isVisible={isVisible}
                            isSelected={isSelected}
                            setSelectedType={onSelectType}
                        />
                    );
                })}
            </VStack>
            {!showLegacyOptions && (
                <Button
                    iconLeft="caretDown"
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    style={applyStyle(legacyButtonStyle)}
                    onPress={displayLegacyOptions}
                >
                    <Translation id="moduleDeviceOnboarding.walletBackupSheet.legacyOptionsLabel" />
                </Button>
            )}
        </BottomSheetModal>
    );
};
