import { useDerivedValue } from 'react-native-reanimated';

import { Box, Text, VStack } from '@suite-native/atoms';
import { useIsMultiline } from '@suite-native/helpers';
import { Translation, useLocale } from '@suite-native/intl';
import { SwipeableWalkthroughStep } from '@suite-native/swipeable-walkthrough';

import { Underline } from './Underline';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupRecapStep1';
import { WalletRecapStepContent } from '../WalletRecapStepContent';
import { WALLET_BACKUP_RECAP_STEPS } from './presets';

const CURRENT_STEP_INDEX = 1;

export const WalletBackupRecapStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const locale = useLocale();
    const isFocused = useDerivedValue(() => currentStepIndex.value === CURRENT_STEP_INDEX);

    const { onTextLayout, numberOfLines } = useIsMultiline('titleMedium');

    // We can be sure that the underline word `Never` is at the beginning of the sentence for english locale only.
    const isUnderlineVisible = numberOfLines === 2 && locale === 'en-US';

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
                                <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step2.title" />
                            </Text>
                            {isUnderlineVisible && <Underline isFocused={isFocused} />}
                        </Box>
                    </Box>
                </VStack>
            </WalletRecapStepContent>
        </SwipeableWalkthroughStep>
    );
};
