import { useSharedValue } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import {
    SwipeableWalkthrough,
    SwipeableWalkthroughCloseButton,
    SwipeableWalkthroughScreenHeader,
} from '@suite-native/atoms';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { CheckBackupTutorialStep1 } from '../components/CheckBackupTutorialStep1';
import { CheckBackupTutorialStep2 } from '../components/CheckBackupTutorialStep2';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;

const WALLET_BACKUP_TUTORIAL_STEPS_COUNT = 2;

export const DeviceCheckBackupTutorialScreen = () => {
    const currentStepIndex = useSharedValue(0);

    const navigation = useNavigation<NavigationProps>();

    const handlePressBack = () => {
        navigation.pop();
    };

    return (
        <Screen
            header={
                <SwipeableWalkthroughScreenHeader
                    onPressBack={handlePressBack}
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
