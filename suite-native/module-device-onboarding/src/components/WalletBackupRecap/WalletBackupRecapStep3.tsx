import { Translation } from '@suite-native/intl';

import { WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletBackupRecapStepContent } from './WalletBackupRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';
import { SwipeableWalkthroughStep } from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

export const WalletBackupRecapStep3 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <SwipeableWalkthroughStep
        totalSteps={WALLET_BACKUP_RECAP_STEPS}
        currentStepIndex={currentStepIndex}
    >
        <WalletBackupRecapStepContent
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step3.callout" />
            }
            title={<Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step3.title" />}
        />
    </SwipeableWalkthroughStep>
);
