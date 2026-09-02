import { useSetAtom } from 'jotai';

import { Box, Button, Card, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { RecoveryCardSvg } from '../assets/RecoveryCardSvg';
import { RecoveryInfoRow } from '../components/RecoveryInfoRow';
import { RecoveryInstructionsBottomSheet } from '../components/RecoveryInstructionsBottomSheet';
import { WalletEntropyLearnMoreLink } from '../components/WalletEntropyLearnMoreLink';

export const RecoveryInstructionsScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.RecoveryInstructions
>) => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const handleContinueButtonPress = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.WalletRecovery);
    };

    const handleGoBack = () => {
        updateOnboardingAnalytics({
            recoveryStepBack: true,
        });
        navigation.goBack();
    };

    return (
        <Screen header={<ScreenHeader closeAction={handleGoBack} />}>
            <VStack paddingTop="sp16" spacing="sp32" justifyContent="space-between" flex={1}>
                <Card>
                    <VStack spacing="sp24">
                        <RecoveryInfoRow
                            iconName="recoverySeed"
                            title={
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bullet1.title" />
                            }
                            description={
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bullet1.description" />
                            }
                        />
                        <RecoveryInfoRow
                            iconName="shieldWarning"
                            title={
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bullet2.title" />
                            }
                            description={
                                <Translation
                                    id="moduleDeviceOnboarding.recoveryInstructionsScreen.bullet2.description"
                                    values={{
                                        link: chunk => <WalletEntropyLearnMoreLink label={chunk} />,
                                    }}
                                />
                            }
                        />
                    </VStack>
                </Card>
                <Box alignItems="center">
                    <RecoveryCardSvg />
                </Box>
                <VStack spacing="sp12" alignItems="stretch">
                    <Button
                        onPress={handleContinueButtonPress}
                        testID="@deviceOnboarding/RecoveryInstructionsScreen/continueButton"
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                    <Button intent="neutral" priority="secondary" onPress={openModal}>
                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.secondaryButton" />
                    </Button>
                </VStack>
            </VStack>
            <RecoveryInstructionsBottomSheet ref={bottomSheetRef} />
        </Screen>
    );
};
