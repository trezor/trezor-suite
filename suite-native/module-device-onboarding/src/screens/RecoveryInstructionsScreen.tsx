import { useSetAtom } from 'jotai';

import { Box, Button, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { RecoveryCardSvg } from '../assets/RecoveryCardSvg';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { RecoveryInstructionsBottomSheet } from '../components/RecoveryInstructionsBottomSheet';

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
                <OnboardingStepHeader
                    callout={
                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.callout" />
                    }
                    title={
                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.title" />
                    }
                    description={
                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.description" />
                    }
                />
                <Box alignItems="center">
                    <RecoveryCardSvg />
                </Box>
                <VStack spacing="sp12" alignItems="stretch">
                    <Button onPress={handleContinueButtonPress}>
                        <Translation id="generic.buttons.continue" />
                    </Button>
                    <Button colorScheme="tertiaryElevation0" onPress={openModal}>
                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.secondaryButton" />
                    </Button>
                </VStack>
            </VStack>
            <RecoveryInstructionsBottomSheet ref={bottomSheetRef} />
        </Screen>
    );
};
