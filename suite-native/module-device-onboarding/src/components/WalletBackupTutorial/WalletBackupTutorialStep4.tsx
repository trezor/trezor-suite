import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ProtectWalletBackupSvg } from '../ProtectWalletBackupSvg';
import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { WalletBackupTutorialNumberedStepProps } from './WalletBackupTutorialStep1';

export const WalletBackupTutorialStep4 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <WalletBackupTutorialStep
        stepId="walletBackupTutorialStep4"
        callout={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step4.callout" />
        }
        title={<Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step4.title" />}
        description={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step4.description" />
        }
        currentStepIndex={currentStepIndex}
    >
        <Box flex={1} justifyContent="center" alignItems="center">
            <ProtectWalletBackupSvg />
        </Box>
    </WalletBackupTutorialStep>
);
