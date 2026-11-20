import { useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceDefaultBackupType, selectIsDeviceInitialized } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import {
    type DeviceOnboardingStackParamList,
    type DeviceOnboardingStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    SwipeableWalkthrough,
    SwipeableWalkthroughScreenHeader,
} from '@suite-native/swipeable-walkthrough';

import { WalletBackupTutorialStep1 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep1';
import { WalletBackupTutorialStep2 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep2';
import { WalletBackupTutorialStep3 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep3';
import { WalletBackupTutorialStep4 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep4';
import { WalletBackupTutorialStep5 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep5';
import { WalletBackupTutorialStep6 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep6';
import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../constants';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;

export const WalletBackupTutorialScreen = () => {
    const currentStepIndex = useSharedValue(0);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);

    const defaultBackupType = useSelector(selectDeviceDefaultBackupType);
    const [selectedBackupType, setSelectedBackupType] = useState<BackupType>(defaultBackupType);

    const navigation = useNavigation<NavigationProps>();

    const handlePressBack = () => {
        // Skip loader screen and navigate back to the create or recover crossroads.
        navigation.pop(2);
    };

    const totalSteps = useMemo(
        () => WALLET_BACKUP_TUTORIAL_STEPS_COUNT - (isDeviceInitialized ? 1 : 0),
        [isDeviceInitialized],
    );

    return (
        <Screen
            header={
                <SwipeableWalkthroughScreenHeader
                    onPressBack={handlePressBack}
                    currentStepIndex={currentStepIndex}
                />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <SwipeableWalkthrough currentStepIndex={currentStepIndex} totalSteps={totalSteps}>
                <WalletBackupTutorialStep1 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep3 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep4 currentStepIndex={currentStepIndex} />
                {!isDeviceInitialized && (
                    <WalletBackupTutorialStep5
                        currentStepIndex={currentStepIndex}
                        selectedType={selectedBackupType}
                        onSelectType={setSelectedBackupType}
                    />
                )}
                <WalletBackupTutorialStep6
                    currentStepIndex={currentStepIndex}
                    selectedType={selectedBackupType}
                    stepIndex={totalSteps - 1}
                />
            </SwipeableWalkthrough>
        </Screen>
    );
};
