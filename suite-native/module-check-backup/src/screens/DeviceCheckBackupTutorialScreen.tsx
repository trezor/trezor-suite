import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { useFocusEffect } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { Screen } from '@suite-native/navigation';
import {
    SwipeableWalkthrough,
    SwipeableWalkthroughCloseButton,
    SwipeableWalkthroughScreenHeader,
} from '@suite-native/swipeable-walkthrough';

import { useHandleCheckBackupExitButtonPress } from '../components/CheckBackupScreenWithExitButton';
import { CheckBackupTutorialStep1 } from '../components/CheckBackupTutorialStep1';
import { CheckBackupTutorialStep2 } from '../components/CheckBackupTutorialStep2';

const WALLET_BACKUP_TUTORIAL_STEPS_COUNT = 2;

export const DeviceCheckBackupTutorialScreen = () => {
    const handleExitButtonPress = useHandleCheckBackupExitButtonPress();
    const currentStepIndex = useSharedValue(0);

    useFocusEffect(
        useCallback(() => {
            analytics.report({
                type: EventType.DeviceSettingsCheckBackupEntered,
            });
        }, []),
    );

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
