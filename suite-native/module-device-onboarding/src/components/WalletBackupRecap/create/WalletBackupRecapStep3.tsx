import { Translation } from '@suite-native/intl';
import { SwipeableWalkthroughStep } from '@suite-native/swipeable-walkthrough';

import { type WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletRecapStepContent } from '../WalletRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';

export const WalletBackupRecapStep3 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <SwipeableWalkthroughStep
        totalSteps={WALLET_BACKUP_RECAP_STEPS}
        currentStepIndex={currentStepIndex}
        stepId="walletBackupRecapStep3"
    >
        <WalletRecapStepContent
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step3.callout" />
            }
            title={<Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step3.title" />}
        />
    </SwipeableWalkthroughStep>
);
