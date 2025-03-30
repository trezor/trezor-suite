import { useState } from 'react';

import * as Haptics from 'expo-haptics';

import { BottomSheet, Button, sizeToDimensionsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CardFooter } from './CardFooter';
import { WalletBackupCard } from './WalletBackupCard';
import { useWalletBackupPicker, walletOptions } from '../../../hooks/useWalletBackupPicker';

const containerStyle = prepareNativeStyle(utils => ({
    // Offset calculated based on the button's height + margin from the design
    marginBottom: sizeToDimensionsMap.large.minHeight + utils.spacings.sp32,
}));

const legacyButtonStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginTop: utils.spacings.sp32,
}));

interface WalletBackupSheetProps {
    showModal: boolean;
    closeModal: () => void;
}

export const WalletBackupSheet = ({ closeModal, showModal }: WalletBackupSheetProps) => {
    const { selectedType, setSelectedType } = useWalletBackupPicker();
    const [showLegacyOptions, setShowLegacyOptions] = useState(false);
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const displayLegacyOptions = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowLegacyOptions(true);
    };

    const submitSelection = () => {
        // TODO: Not implemented yet
    };

    return (
        <BottomSheet
            title={translate('moduleDeviceOnboarding.walletBackupSheet.title')}
            isVisible={showModal}
            onClose={closeModal}
            footer={<CardFooter selectedType={selectedType} onSubmit={submitSelection} />}
            style={applyStyle(containerStyle)}
        >
            {walletOptions.map(type => {
                const isSelected = type === selectedType;
                const isVisible =
                    type === 'single-share' || type === 'multi-share' || showLegacyOptions;

                return (
                    <WalletBackupCard
                        key={type}
                        type={type}
                        isVisible={isVisible}
                        isSelected={isSelected}
                        setSelectedType={setSelectedType}
                    />
                );
            })}
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
