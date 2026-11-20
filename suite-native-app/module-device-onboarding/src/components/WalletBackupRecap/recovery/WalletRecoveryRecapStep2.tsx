import { HoldToConfirmButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SwipeableWalkthroughStep } from '@suite-native/swipeable-walkthrough';

import {
    WALLET_RECOVERY_RECAP_STEPS,
    type WalletBackupTutorialNumberedStepProps,
} from './WalletRecoveryRecapStep1';
import { useOnWalletRecapFinishedNavigation } from '../../../hooks/useOnWalletRecapFinishedNavigation';
import { WalletRecapStepContent } from '../../WalletBackupRecap/WalletRecapStepContent';

export const WalletRecoveryRecapStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const { onWalletRecapFinishedNavigation } = useOnWalletRecapFinishedNavigation();

    return (
        <SwipeableWalkthroughStep
            stepId="walletRecoveryRecapStep2"
            totalSteps={WALLET_RECOVERY_RECAP_STEPS}
            currentStepIndex={currentStepIndex}
            continueButton={
                <HoldToConfirmButton
                    onSuccess={onWalletRecapFinishedNavigation}
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
