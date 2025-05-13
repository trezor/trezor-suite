import { ReactNode } from 'react';

import { Box, Card, Divider, HStack, IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { TrezorDeviceSvg } from '@suite-native/device';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';
import { RecoveryCardSvg } from '../../assets/RecoveryCardSvg';

const imageContainerStyle = prepareNativeStyle(() => ({
    width: 64,
    height: 80,
    justifyContent: 'center',
    alignItems: 'flex-start',
}));

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: 12,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.small,
    ...utils.boxShadows.none,
}));

const stepContainerStyle = prepareNativeStyle(() => ({
    flex: 1,
    width: '100%',
    paddingTop: 32,
}));

const dividerStyle = prepareNativeStyle(() => ({
    marginHorizontal: -16,
}));

const SectionHeader = ({
    title,
    description,
    descriptionColor = 'textSecondaryHighlight',
    image,
}: {
    title: TxKeyPath;
    description: TxKeyPath;
    descriptionColor?: Color;
    image: ReactNode;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack alignItems="center" spacing={0}>
            <Box style={applyStyle(imageContainerStyle)}>{image}</Box>
            <VStack spacing={0}>
                <Text variant="titleSmall">
                    <Translation id={title} />
                </Text>
                <Text variant="callout" color={descriptionColor}>
                    <Translation id={description} />
                </Text>
            </VStack>
        </HStack>
    );
};

const IMAGE_WIDTH = 60;
const IMAGE_HEIGHT = 56;

export const WalletBackupTutorialStep3 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <WalletBackupTutorialStep
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.title" />
            }
            currentStepIndex={currentStepIndex}
        >
            <Box style={applyStyle(stepContainerStyle)}>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing="sp16">
                        <SectionHeader
                            title="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section1.title"
                            description="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section1.description"
                            descriptionColor="textSecondaryHighlight"
                            image={<TrezorDeviceSvg />}
                        />
                        <IconListTextItem
                            spacing="sp16"
                            icon="arrowsLeftRight"
                            iconSize="mediumLarge"
                        >
                            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section1.bullet1" />
                        </IconListTextItem>
                        <IconListTextItem spacing="sp16" icon="lock" iconSize="mediumLarge">
                            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section1.bullet2" />
                        </IconListTextItem>
                        <Divider style={applyStyle(dividerStyle)} />
                    </VStack>
                    <VStack spacing="sp16">
                        <SectionHeader
                            title="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section2.title"
                            description="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section2.description"
                            descriptionColor="textAlertYellow"
                            image={<RecoveryCardSvg width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />}
                        />
                        <IconListTextItem
                            spacing="sp16"
                            icon="arrowCounterClockwise"
                            iconSize="mediumLarge"
                        >
                            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step3.section2.bullet1" />
                        </IconListTextItem>
                    </VStack>
                </Card>
            </Box>
        </WalletBackupTutorialStep>
    );
};
