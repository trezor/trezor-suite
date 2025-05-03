import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BackupRiskCardsAnimation } from '../BackupRiskCardsAnimation';
import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';

export const WalletBackupTutorialStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <WalletBackupTutorialStep
        stepId="walletBackupTutorialStep2"
        callout={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step2.callout" />
        }
        title={<Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step2.title" />}
        currentStepIndex={currentStepIndex}
    >
        <Box flex={1} justifyContent="center" alignItems="center">
            <BackupRiskCardsAnimation />
        </Box>
    </WalletBackupTutorialStep>
);
