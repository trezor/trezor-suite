import { useNavigation } from '@react-navigation/core';

import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletBackupRecapStepContent } from './WalletBackupRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';
import { HoldToConfirmButton } from '../SwipeableWalkthrough/HoldToConfirmButton';
import { SwipeableWalkthroughStep } from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupRecap,
    RootStackParamList
>;

export const WalletBackupRecapStep4 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const navigation = useNavigation<NavigationProps>();

    const handleHoldToStartSuccess = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.CreatePin);
    };

    return (
        <SwipeableWalkthroughStep
            totalSteps={WALLET_BACKUP_RECAP_STEPS}
            currentStepIndex={currentStepIndex}
            continueButton={
                <HoldToConfirmButton
                    onSuccess={handleHoldToStartSuccess}
                    buttonLabelId="moduleDeviceOnboarding.walletBackupRecapScreen.step4.holdToConfirmButton"
                />
            }
        >
            <WalletBackupRecapStepContent
                callout={
                    <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step4.callout" />
                }
                title={
                    <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step4.title" />
                }
            />
        </SwipeableWalkthroughStep>
    );
};
