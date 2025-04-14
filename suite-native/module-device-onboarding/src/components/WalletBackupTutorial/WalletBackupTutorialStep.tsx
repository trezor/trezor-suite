import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../../constants';
import {
    SwipeableWalkthroughStep,
    SwipeableWalkthroughStepProps,
} from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

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
