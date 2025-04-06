import { useState } from 'react';

import * as Haptics from 'expo-haptics';

import { Box, Button, Card, InlineAlertBox, Text, TitleHeader } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';
import { walletBackupTutorialCopyByType } from './presets';
import { WalletBackupType } from '../../screens/WalletBackupTutorialScreen';
import { WalletBackupSheet } from '../WalletBackupSheet/WalletBackupSheet';

const cardStyle = prepareNativeStyle<{ isCalloutButtonShown: boolean }>(
    (utils, { isCalloutButtonShown }) => ({
        padding: utils.spacings.sp16,
        paddingBottom: isCalloutButtonShown ? utils.spacings.sp16 : 0,
    }),
);

const descriptionStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp2,
    marginBottom: utils.spacings.sp16,
}));

const moreOptionsStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginTop: utils.spacings.sp16,
}));

const innerContainerStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

type WalletBackupTutorialStep5Props = {
    selectedType: WalletBackupType;
    onSelectType: (type: WalletBackupType) => void;
} & WalletBackupTutorialNumberedStepProps;

export const WalletBackupTutorialStep5 = ({
    currentStepIndex,
    selectedType,
    onSelectType,
}: WalletBackupTutorialStep5Props) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const [isModalShown, setIsModalShown] = useState(false);
    const isCalloutButtonShown =
        selectedType === 'shamir-single' || selectedType === 'shamir-advanced';

    const openBackupSelection = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsModalShown(true);
    };

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_MULTI_SHARE_BACKUP_URL);
    };

    const closeModal = () => {
        setIsModalShown(false);
    };

    return (
        <WalletBackupTutorialStep
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.title" />
            }
            currentStepIndex={currentStepIndex}
        >
            <Box flex={1} marginTop="sp32" style={applyStyle(innerContainerStyle)}>
                <Card style={applyStyle(cardStyle, { isCalloutButtonShown })}>
                    <TitleHeader
                        title={
                            <Translation id={walletBackupTutorialCopyByType[selectedType].title} />
                        }
                    />
                    <Text color="textSubdued" variant="hint" style={applyStyle(descriptionStyle)}>
                        <Translation
                            id={walletBackupTutorialCopyByType[selectedType].description}
                        />
                    </Text>
                    {isCalloutButtonShown && (
                        <InlineAlertBox
                            iconName={selectedType === 'shamir-single' ? 'checkCircle' : undefined}
                            variant={selectedType === 'shamir-advanced' ? 'warning' : 'neutral'}
                            buttonLabel={
                                selectedType === 'shamir-advanced' ? (
                                    <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-advanced.calloutActionLabel" />
                                ) : undefined
                            }
                            title={
                                <Translation
                                    id={walletBackupTutorialCopyByType[selectedType].calloutLabel}
                                />
                            }
                            buttonProps={{
                                viewLeft: 'arrowSquareOut',
                            }}
                            onButtonPress={handleLearnMorePress}
                        />
                    )}
                </Card>
                <Button
                    viewLeft={<Icon name="caretDown" size="medium" />}
                    colorScheme="tertiaryElevation0"
                    size="small"
                    style={applyStyle(moreOptionsStyle)}
                    onPress={openBackupSelection}
                >
                    <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.moreOptionsButton" />
                </Button>
            </Box>
            <WalletBackupSheet
                isDisplayed={isModalShown}
                onCloseModal={closeModal}
                selectedType={selectedType}
                onSelectType={onSelectType}
            />
        </WalletBackupTutorialStep>
    );
};
