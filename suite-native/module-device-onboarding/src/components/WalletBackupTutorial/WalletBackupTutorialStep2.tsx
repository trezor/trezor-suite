import { useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useIsFocused } from '@react-navigation/native';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BackupRiskCardsAnimation } from '../BackupRiskCardsAnimation';
import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { type WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';

export const WalletBackupTutorialStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const isFocused = useIsFocused();
    const [isStepActive, setIsStepActive] = useState(false);

    useAnimatedReaction(
        () => currentStepIndex.get() === 1,
        (isActive, previousIsActive) => {
            if (isActive !== previousIsActive) {
                runOnJS(setIsStepActive)(isActive);
            }
        },
    );

    return (
        <WalletBackupTutorialStep
            stepId="walletBackupTutorialStep2"
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step2.callout" />
            }
            title={
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step2.title" />
            }
            currentStepIndex={currentStepIndex}
        >
            <Box flex={1} justifyContent="center" alignItems="center">
                {/* Unmount hidden Marquees to stop their continuous UI-thread frame callbacks. */}
                {isFocused && isStepActive && <BackupRiskCardsAnimation />}
            </Box>
        </WalletBackupTutorialStep>
    );
};
