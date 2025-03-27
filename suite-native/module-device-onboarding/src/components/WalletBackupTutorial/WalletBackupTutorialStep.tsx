import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../../constants';
import {
    SwipeableWalkthroughStep,
    SwipeableWalkthroughStepProps,
} from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

export type WalletBackupTutorialStepProps = Omit<
    SwipeableWalkthroughStepProps,
    'onNextButtonPress'
>;

export const WalletBackupTutorialStep = ({
    currentStepIndex,
    ...swipeableWalkthroughStepProps
}: WalletBackupTutorialStepProps) => {
    const handleNextButtonPress = () => {
        if (currentStepIndex.value < WALLET_BACKUP_TUTORIAL_STEPS_COUNT - 1) {
            currentStepIndex.value += 1;
        }
    };

    return (
        <SwipeableWalkthroughStep
            {...swipeableWalkthroughStepProps}
            currentStepIndex={currentStepIndex}
            onNextButtonPress={handleNextButtonPress}
        />
    );
};
