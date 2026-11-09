import { useDerivedValue } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { type BackupType } from '@suite-common/suite-types';
import { HoldToConfirmButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { WalletBackupInstructionCards } from './WalletBackupInstructionCards';
import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { type WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';
import { updateOnboardingAnalyticsAtom } from '../../../atoms';

type WalletBackupTutorialStep6Props = WalletBackupTutorialNumberedStepProps & {
    selectedType: BackupType;
    stepIndex?: number;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletBackupTutorial,
    RootStackParamList
>;

export const WalletBackupTutorialStep6 = ({
    currentStepIndex,
    selectedType,
    stepIndex,
}: WalletBackupTutorialStep6Props) => {
    const navigation = useNavigation<NavigationProps>();
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const isStepFocused = useDerivedValue(() => currentStepIndex.value === stepIndex);

    const isMultishareSelected = selectedType === 'shamir-advanced';

    const handleHoldToStartSuccess = () => {
        updateOnboardingAnalytics({
            seedType: selectedType,
        });
        navigation.navigate(DeviceOnboardingStackRoutes.WalletCreation, {
            walletBackupType: selectedType,
        });
    };

    return (
        <WalletBackupTutorialStep
            stepId="walletBackupTutorialStep6"
            currentStepIndex={currentStepIndex}
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.title" />
            }
            continueButton={
                <HoldToConfirmButton
                    onSuccess={handleHoldToStartSuccess}
                    isDisplayed={isStepFocused}
                />
            }
        >
            <WalletBackupInstructionCards
                isMultishareSelected={isMultishareSelected}
                isStepFocused={isStepFocused}
            />
        </WalletBackupTutorialStep>
    );
};
