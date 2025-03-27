import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';

export const WalletBackupTutorialStep5 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <WalletBackupTutorialStep
        callout={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.callout" />
        }
        title={<Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step5.title" />}
        currentStepIndex={currentStepIndex}
    >
        <Box flex={1} justifyContent="center" alignItems="center">
            {/* TODO: https://github.com/trezor/trezor-suite/issues/17455 */}
            <Text variant="titleSmall" color="textAlertRed" textAlign="center">
                TODO: Implement wallet backup type selection
            </Text>
        </Box>
    </WalletBackupTutorialStep>
);
