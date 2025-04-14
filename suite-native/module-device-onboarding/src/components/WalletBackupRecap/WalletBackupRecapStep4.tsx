import { Translation } from '@suite-native/intl';

import { WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletBackupRecapStepContent } from './WalletBackupRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';
import { HoldToConfirmButton } from '../SwipeableWalkthrough/HoldToConfirmButton';
import { SwipeableWalkthroughStep } from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

export const WalletBackupRecapStep4 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    // TODO: add action
    const handleHoldToStartSuccess = () => {};

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
