import * as Haptics from 'expo-haptics';

import { type BackupType } from '@suite-common/suite-types';
import {
    Box,
    Button,
    Card,
    InlineAlertBox,
    Text,
    TitleHeader,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { type WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';
import { walletBackupTutorialCopyByType } from './presets';
import { WalletBackupSheet } from '../WalletBackupSheet/WalletBackupSheet';

const cardStyle = prepareNativeStyle<{ isCalloutButtonShown: boolean }>(
    (utils, { isCalloutButtonShown }) => ({
        padding: utils.spacings.sp16,
        paddingBottom: isCalloutButtonShown ? utils.spacings.sp16 : 0,
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.borderNeutral,
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
    selectedType: BackupType;
    onSelectType: (type: BackupType) => void;
} & WalletBackupTutorialNumberedStepProps;

export const WalletBackupTutorialStep5 = ({
    currentStepIndex,
    selectedType,
    onSelectType,
}: WalletBackupTutorialStep5Props) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const isCalloutButtonShown =
        selectedType === 'shamir-single' || selectedType === 'shamir-advanced';

    const openBackupSelection = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        openModal();
    };

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_MULTI_SHARE_BACKUP_URL);
    };

    return (
        <WalletBackupTutorialStep
            stepId="walletBackupTutorialStep5"
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
                    <Text
                        color="contentSecondary"
                        variant="body-sm"
                        style={applyStyle(descriptionStyle)}
                        testID={`onboarding/WalletBackupTutorialStep5/selectedType=${selectedType}`}
                    >
                        <Translation
                            id={walletBackupTutorialCopyByType[selectedType].description}
                        />
                    </Text>
                    {isCalloutButtonShown && (
                        <InlineAlertBox
                            variant={selectedType === 'shamir-advanced' ? 'warning' : 'success'}
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
                                iconLeft: 'arrowSquareOut',
                            }}
                            onButtonPress={handleLearnMorePress}
                        />
                    )}
                </Card>
                <Button
                    iconLeft="caretDown"
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    style={applyStyle(moreOptionsStyle)}
                    onPress={openBackupSelection}
                >
                    <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.moreOptionsButton" />
                </Button>
            </Box>
            <WalletBackupSheet
                ref={bottomSheetRef}
                onCloseModal={closeModal}
                selectedType={selectedType}
                onSelectType={onSelectType}
            />
        </WalletBackupTutorialStep>
    );
};
