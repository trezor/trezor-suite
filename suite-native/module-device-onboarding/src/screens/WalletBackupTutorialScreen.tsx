import { useCallback, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/core';

import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { SwipeableWalkthrough } from '../components/SwipeableWalkthrough/SwipeableWalkthrough';
import { SwipeableWalkthroughScreenHeader } from '../components/SwipeableWalkthrough/SwipeableWalkthroughScreenHeader';
import { WalletBackupTutorialStep1 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep1';
import { WalletBackupTutorialStep2 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep2';
import { WalletBackupTutorialStep3 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep3';
import { WalletBackupTutorialStep4 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep4';
import { WalletBackupTutorialStep5 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep5';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;
export type WalletBackupType = 'shamir-single' | 'shamir-advanced' | '12-words' | '24-words';

export const WalletBackupTutorialScreen = () => {
    const currentStepIndex = useSharedValue(0);
    const [selectedBackupType, setSelectedBackupType] = useState<WalletBackupType>('shamir-single');

    const navigation = useNavigation<NavigationProps>();

    const handlePressBackButton = useCallback(() => {
        if (currentStepIndex.value === 0) {
            // Skip loader screen and navigate back to the create or recover crossroads.
            navigation.pop(2);
        } else {
            currentStepIndex.value -= 1;
        }
    }, [navigation, currentStepIndex]);

    return (
        <Screen
            header={
                <SwipeableWalkthroughScreenHeader
                    onPressBack={handlePressBackButton}
                    currentStepIndex={currentStepIndex}
                />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <SwipeableWalkthrough currentStepIndex={currentStepIndex}>
                <WalletBackupTutorialStep1 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep3 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep4 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep5
                    currentStepIndex={currentStepIndex}
                    selectedType={selectedBackupType}
                    onSelectType={setSelectedBackupType}
                />
            </SwipeableWalkthrough>
        </Screen>
    );
};
