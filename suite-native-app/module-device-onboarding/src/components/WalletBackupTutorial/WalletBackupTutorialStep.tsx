import {
    SwipeableWalkthroughStep,
    type SwipeableWalkthroughStepProps,
} from '@suite-native/swipeable-walkthrough';

import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../../constants';

export type WalletBackupTutorialStepProps = Omit<SwipeableWalkthroughStepProps, 'totalSteps'>;

export const WalletBackupTutorialStep = ({
    currentStepIndex,
    ...swipeableWalkthroughStepProps
}: WalletBackupTutorialStepProps) => (
    <SwipeableWalkthroughStep
        {...swipeableWalkthroughStepProps}
        currentStepIndex={currentStepIndex}
        totalSteps={WALLET_BACKUP_TUTORIAL_STEPS_COUNT}
    />
);
