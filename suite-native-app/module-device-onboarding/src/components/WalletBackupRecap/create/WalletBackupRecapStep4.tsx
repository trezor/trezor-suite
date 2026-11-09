import { HoldToConfirmButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SwipeableWalkthroughStep } from '@suite-native/swipeable-walkthrough';

import { type WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletRecapStepContent } from '../WalletRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';
import { useOnWalletRecapFinishedNavigation } from '../../../hooks/useOnWalletRecapFinishedNavigation';

export const WalletBackupRecapStep4 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const { onWalletRecapFinishedNavigation } = useOnWalletRecapFinishedNavigation();

    return (
        <SwipeableWalkthroughStep
            totalSteps={WALLET_BACKUP_RECAP_STEPS}
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
                    <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step4.callout" />
                }
                title={
                    <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step4.title" />
                }
            />
        </SwipeableWalkthroughStep>
    );
};
