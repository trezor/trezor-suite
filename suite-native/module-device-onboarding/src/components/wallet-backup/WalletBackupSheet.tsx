import { useState } from 'react';

import * as Haptics from 'expo-haptics';

import { BottomSheet, Button, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CardFooter } from './CardFooter';
import { WalletBackupCard } from './WalletBackupCard';

const containerStyle = prepareNativeStyle(utils => ({
    // Offset calculated based on the button's height + margin from the design
    marginBottom: buttonSizeToDimensionsMap.large.minHeight + utils.spacings.sp32,
}));

const legacyButtonStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginTop: utils.spacings.sp32,
}));

interface WalletBackupSheetProps {
    isDisplayed: boolean;
    closeModal: () => void;
}

export type WalletBackupType = 'shamir-single' | 'shamir-advanced' | '12-words' | '24-words';

const walletOptions: WalletBackupType[] = [
    'shamir-single',
    'shamir-advanced',
    '12-words',
    '24-words',
];

export const WalletBackupSheet = ({ closeModal, isDisplayed }: WalletBackupSheetProps) => {
    const [selectedType, setSelectedType] = useState<WalletBackupType>('shamir-single');
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
            isVisible={isDisplayed}
            onClose={closeModal}
            footer={<CardFooter selectedType={selectedType} onSubmit={submitSelection} />}
            style={applyStyle(containerStyle)}
        >
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
