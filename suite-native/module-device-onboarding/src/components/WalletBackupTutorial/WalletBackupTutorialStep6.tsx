import { useDerivedValue } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/core';

import { WalletBackupType } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { WalletBackupInstructionCards } from './WalletBackupInstructionCards';
import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';
import { HoldToConfirmButton } from '../SwipeableWalkthrough/HoldToConfirmButton';

type WalletBackupTutorialStep6Props = WalletBackupTutorialNumberedStepProps & {
    selectedType: WalletBackupType;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;

export const WalletBackupTutorialStep6 = ({
    currentStepIndex,
    selectedType,
}: WalletBackupTutorialStep6Props) => {
    const navigation = useNavigation<NavigationProps>();

    const isStepFocused = useDerivedValue(() => currentStepIndex.value === 5);

    const isMultishareSelected = selectedType === 'shamir-advanced';

    const handleHoldToStartSuccess = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.WalletCreation, {
            walletBackupType: selectedType,
        });
    };

    return (
        <WalletBackupTutorialStep
            currentStepIndex={currentStepIndex}
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.title" />
            }
            continueButton={
                <HoldToConfirmButton
                    onSuccess={handleHoldToStartSuccess}
                    isDisplayed={isStepFocused}
                />
            }
        >
            <WalletBackupInstructionCards
                isMultishareSelected={isMultishareSelected}
                isStepFocused={isStepFocused}
            />
        </WalletBackupTutorialStep>
    );
};
