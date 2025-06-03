import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import {
    WALLET_RECOVERY_RECAP_STEPS,
    WalletBackupTutorialNumberedStepProps,
} from './WalletRecoveryRecapStep1';
import { HoldToConfirmButton } from '../../SwipeableWalkthrough/HoldToConfirmButton';
import { SwipeableWalkthroughStep } from '../../SwipeableWalkthrough/SwipeableWalkthroughStep';
import { WalletRecapStepContent } from '../../WalletBackupRecap/WalletRecapStepContent';

type NavigationProps = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletRecoveryRecap
>;

export const WalletRecoveryRecapStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const navigation = useNavigation<NavigationProps>();

    const handleHoldToStartSuccess = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.CreatePin);
    };

    return (
        <SwipeableWalkthroughStep
            stepId="walletRecoveryRecapStep2"
            totalSteps={WALLET_RECOVERY_RECAP_STEPS}
            currentStepIndex={currentStepIndex}
            continueButton={
                <HoldToConfirmButton
                    onSuccess={handleHoldToStartSuccess}
                    buttonLabelId="moduleDeviceOnboarding.walletBackupRecapScreen.step4.holdToConfirmButton"
                />
            }
        >
            <WalletRecapStepContent
                callout={
                    <Translation id="moduleDeviceOnboarding.walletRecoveryRecapScreen.step2.callout" />
                }
                title={
                    <Translation id="moduleDeviceOnboarding.walletRecoveryRecapScreen.step2.title" />
                }
            />
        </SwipeableWalkthroughStep>
    );
};
