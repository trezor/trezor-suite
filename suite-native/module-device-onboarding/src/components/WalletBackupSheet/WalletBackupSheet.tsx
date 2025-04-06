import { useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';

import { BottomSheet, BottomSheetHandle, Button, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { WalletBackupCard } from './WalletBackupCard/WalletBackupCard';
import { WalletBackupSheetFooter } from './WalletBackupSheetFooter';
import { WalletBackupType } from '../../screens/WalletBackupTutorialScreen';

const containerStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp32,
}));

const legacyButtonStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginTop: utils.spacings.sp32,
}));

interface WalletBackupSheetProps {
    isDisplayed: boolean;
    onCloseModal: () => void;
    selectedType: WalletBackupType;
    onSelectType: (type: WalletBackupType) => void;
}

const walletOptions = [
    'shamir-single',
    'shamir-advanced',
    '12-words',
    '24-words',
] as const satisfies WalletBackupType[];

export const WalletBackupSheet = ({
    onCloseModal,
    isDisplayed,
    onSelectType,
    selectedType,
}: WalletBackupSheetProps) => {
    const [showLegacyOptions, setShowLegacyOptions] = useState(false);
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const bottomSheetRef = useRef<BottomSheetHandle>(null);

    const displayLegacyOptions = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowLegacyOptions(true);
    };

    const submitSelection = () => {
        bottomSheetRef.current?.closeWithAnimation();
    };

    return (
        <BottomSheet
            title={translate('moduleDeviceOnboarding.walletBackupSheet.title')}
            isVisible={isDisplayed}
            onClose={onCloseModal}
            ref={bottomSheetRef}
            footer={
                <WalletBackupSheetFooter selectedType={selectedType} onSubmit={submitSelection} />
            }
            style={applyStyle(containerStyle)}
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
                    viewLeft={<Icon name="caretDown" size="medium" />}
                    colorScheme="tertiaryElevation0"
                    size="small"
                    style={applyStyle(legacyButtonStyle)}
                    onPress={displayLegacyOptions}
                >
                    <Translation id="moduleDeviceOnboarding.walletBackupSheet.legacyOptionsLabel" />
                </Button>
            )}
        </BottomSheet>
    );
};
