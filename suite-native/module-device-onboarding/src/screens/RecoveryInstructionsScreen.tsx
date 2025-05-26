import { Box, Button, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

import { RecoveryCardSvg } from '../assets/RecoveryCardSvg';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { RecoveryInstructionsBottomSheet } from '../components/RecoveryInstructionsBottomSheet';

export const RecoveryInstructionsScreen = () => {
    const { showToast } = useToast();

    const handlePrimaryButtonPress = () => {
        showToast({
            message: 'TODO: redirect to the next screen',
            variant: 'warning',
        });
    };
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="sp32" justifyContent="space-between" flex={1}>
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
                    <Button onPress={handlePrimaryButtonPress}>
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
