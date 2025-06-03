import { useDerivedValue } from 'react-native-reanimated';

import { Box, Text, VStack } from '@suite-native/atoms';
import { useIsMultiline } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';

import { Underline } from './Underline';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletRecapStepContent } from '../WalletRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';
import { SwipeableWalkthroughStep } from '../../SwipeableWalkthrough/SwipeableWalkthroughStep';

const CURRENT_STEP_INDEX = 1;

export const WalletBackupRecapStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const isFocused = useDerivedValue(() => currentStepIndex.value === CURRENT_STEP_INDEX);

    const { onTextLayout, isMultiline } = useIsMultiline('titleMedium');

    return (
        <SwipeableWalkthroughStep
            stepId="walletBackupRecapStep2"
            totalSteps={WALLET_BACKUP_RECAP_STEPS}
            currentStepIndex={currentStepIndex}
        >
            <WalletRecapStepContent>
                <VStack spacing="sp12" alignItems="center">
                    <Text variant="highlight" color="textSecondaryHighlight" textAlign="center">
                        <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step2.callout" />
                    </Text>
                    <Box>
                        <Box alignSelf="center">
                            <Text variant="titleMedium" textAlign="center" onLayout={onTextLayout}>
                                <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step2.titleUnderlined" />
                            </Text>
                            {!isMultiline && <Underline isFocused={isFocused} />}
                        </Box>
                        <Text variant="titleMedium" textAlign="center">
                            <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step2.titleRegular" />
                        </Text>
                    </Box>
                </VStack>
            </WalletRecapStepContent>
        </SwipeableWalkthroughStep>
    );
};
