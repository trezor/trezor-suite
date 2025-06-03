import { SharedValue } from 'react-native-reanimated';

import { Translation } from '@suite-native/intl';

import { SwipeableWalkthroughStep } from '../../SwipeableWalkthrough/SwipeableWalkthroughStep';
import { WalletRecapStepContent } from '../../WalletBackupRecap/WalletRecapStepContent';

export type WalletBackupTutorialNumberedStepProps = {
    currentStepIndex: SharedValue<number>;
};

export const WALLET_RECOVERY_RECAP_STEPS = 2;

export const WalletRecoveryRecapStep1 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <SwipeableWalkthroughStep
        stepId="walletRecoveryRecapStep1"
        totalSteps={WALLET_RECOVERY_RECAP_STEPS}
        currentStepIndex={currentStepIndex}
    >
        <WalletRecapStepContent
            callout={
                <Translation id="moduleDeviceOnboarding.walletRecoveryRecapScreen.step1.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletRecoveryRecapScreen.step1.title" />
            }
        />
    </SwipeableWalkthroughStep>
);
