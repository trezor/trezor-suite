import { useCallback, useMemo, useRef, useState } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    selectDeviceDefaultBackupType,
    selectDeviceModel,
    selectIsDeviceInitialized,
} from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    SwipeableWalkthrough,
    SwipeableWalkthroughScreenHeader,
} from '@suite-native/swipeable-walkthrough';
import { DeviceModelInternal } from '@trezor/device-utils';

import { WalletBackupTutorialStep1 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep1';
import { WalletBackupTutorialStep2 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep2';
import { WalletBackupTutorialStep3 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep3';
import { WalletBackupTutorialStep4 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep4';
import { WalletBackupTutorialStep5 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep5';
import { WalletBackupTutorialStep6 } from '../components/WalletBackupTutorial/WalletBackupTutorialStep6';
import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../constants';

const NFC_TUTORIAL_STEPS_COUNT = 4;

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;

type RouteProps = RouteProp<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial
>;

export const WalletBackupTutorialScreen = () => {
    const currentStepIndex = useSharedValue(0);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const route = useRoute<RouteProps>();
    const skipNfcBranch = route.params?.skipNfcBranch ?? false;

    const defaultBackupType = useSelector(selectDeviceDefaultBackupType);
    const [selectedBackupType, setSelectedBackupType] = useState<BackupType>(defaultBackupType);

    const navigation = useNavigation<NavigationProps>();

    const isN4w1BackupEnabled = useFeatureFlag(FeatureFlag.IsN4w1BackupEnabled);
    const deviceModel = useSelector(selectDeviceModel);
    const isNfcAvailable =
        isN4w1BackupEnabled && deviceModel === DeviceModelInternal.T3W1 && !skipNfcBranch;

    const hasNavigatedToNfc = useRef(false);

    const handlePressBack = () => {
        // Skip loader screen and navigate back to the create or recover crossroads.
        navigation.pop(2);
    };

    const navigateToNfcBackupType = useCallback(() => {
        if (hasNavigatedToNfc.current) return;
        hasNavigatedToNfc.current = true;
        navigation.navigate(DeviceOnboardingStackRoutes.NfcBackupType);
    }, [navigation]);

    // When NFC is available, navigate to NfcBackupType when user advances past the last educational step.
    useAnimatedReaction(
        () => currentStepIndex.value,
        (value, previousValue) => {
            if (isNfcAvailable && previousValue !== null && value >= NFC_TUTORIAL_STEPS_COUNT) {
                runOnJS(navigateToNfcBackupType)();
            }
        },
    );

    const totalSteps = useMemo(() => {
        if (isNfcAvailable) {
            // Only show educational steps 1-4; user is then navigated to NfcBackupTypeScreen.
            // We add +1 so the SwipeableWalkthrough allows advancing past step 4.
            return NFC_TUTORIAL_STEPS_COUNT + 1;
        }

        if (skipNfcBranch) {
            // User already saw educational steps in NFC flow, skip directly to type selector.
            return isDeviceInitialized ? 1 : 2;
        }

        return WALLET_BACKUP_TUTORIAL_STEPS_COUNT - (isDeviceInitialized ? 1 : 0);
    }, [isNfcAvailable, isDeviceInitialized, skipNfcBranch]);

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
                {!skipNfcBranch && (
                    <>
                        <WalletBackupTutorialStep1 currentStepIndex={currentStepIndex} />
                        <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />
                        <WalletBackupTutorialStep3 currentStepIndex={currentStepIndex} />
                        <WalletBackupTutorialStep4 currentStepIndex={currentStepIndex} />
                    </>
                )}
                {!isNfcAvailable && !isDeviceInitialized && (
                    <WalletBackupTutorialStep5
                        currentStepIndex={currentStepIndex}
                        selectedType={selectedBackupType}
                        onSelectType={setSelectedBackupType}
                    />
                )}
                {!isNfcAvailable && (
                    <WalletBackupTutorialStep6
                        currentStepIndex={currentStepIndex}
                        selectedType={selectedBackupType}
                        stepIndex={totalSteps - 1}
                    />
                )}
            </SwipeableWalkthrough>
        </Screen>
    );
};
