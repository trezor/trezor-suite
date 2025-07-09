import { useSharedValue } from 'react-native-reanimated';

import {
    SwipeableWalkthrough,
    SwipeableWalkthroughCloseButton,
    SwipeableWalkthroughScreenHeader,
} from '@suite-native/atoms';
import { useDeviceConnectionGuard } from '@suite-native/module-device-settings/src/hooks/useDeviceConnectionGuard';
import { Screen } from '@suite-native/navigation';

import { useHandleCheckBackupExitButtonPress } from '../components/CheckBackupScreenWithExitButton';
import { CheckBackupTutorialStep1 } from '../components/CheckBackupTutorialStep1';
import { CheckBackupTutorialStep2 } from '../components/CheckBackupTutorialStep2';

const WALLET_BACKUP_TUTORIAL_STEPS_COUNT = 2;

export const DeviceCheckBackupTutorialScreen = () => {
    useDeviceConnectionGuard();
    const handleExitButtonPress = useHandleCheckBackupExitButtonPress();
    const currentStepIndex = useSharedValue(0);

    return (
        <Screen
            header={
                <SwipeableWalkthroughScreenHeader
                    onPressBack={handleExitButtonPress}
                    currentStepIndex={currentStepIndex}
                    CustomBackButton={SwipeableWalkthroughCloseButton}
                />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <SwipeableWalkthrough
                currentStepIndex={currentStepIndex}
                totalSteps={WALLET_BACKUP_TUTORIAL_STEPS_COUNT}
            >
                <CheckBackupTutorialStep1 currentStepIndex={currentStepIndex} />
                <CheckBackupTutorialStep2 currentStepIndex={currentStepIndex} />
            </SwipeableWalkthrough>
        </Screen>
    );
};
