import { useCallback, useEffect, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { WalletBackupType } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';

import { SwipeableWalkthrough } from '../components/SwipeableWalkthrough/SwipeableWalkthrough';
import { SwipeableWalkthroughScreenHeader } from '../components/SwipeableWalkthrough/SwipeableWalkthroughScreenHeader';
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
    const deviceModel = useSelector(selectDeviceModel);
    const [selectedBackupType, setSelectedBackupType] = useState<WalletBackupType>(
        deviceModel === DeviceModelInternal.T2T1 ? '12-words' : 'shamir-single',
    );

    const navigation = useNavigation<NavigationProps>();

    const handlePressBackButton = useCallback(() => {
        if (currentStepIndex.value === 0) {
            // Skip loader screen and navigate back to the create or recover crossroads.
            navigation.pop(2);
        } else {
            currentStepIndex.value -= 1;
        }
    }, [navigation, currentStepIndex]);

    useEffect(() => {
        // Override default navigation GO_BACK action to align it with the UI back button behavior.
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                handlePressBackButton();
            }
        });

        return unsubscribe;
    }, [handlePressBackButton, navigation]);

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
            <SwipeableWalkthrough
                currentStepIndex={currentStepIndex}
                totalSteps={WALLET_BACKUP_TUTORIAL_STEPS_COUNT}
            >
                <WalletBackupTutorialStep1 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep3 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep4 currentStepIndex={currentStepIndex} />
                <WalletBackupTutorialStep5
                    currentStepIndex={currentStepIndex}
                    selectedType={selectedBackupType}
                    onSelectType={setSelectedBackupType}
                />
                <WalletBackupTutorialStep6
                    currentStepIndex={currentStepIndex}
                    selectedType={selectedBackupType}
                />
            </SwipeableWalkthrough>
        </Screen>
    );
};
