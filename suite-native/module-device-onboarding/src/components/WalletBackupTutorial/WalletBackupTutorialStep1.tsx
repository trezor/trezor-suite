import { SharedValue } from 'react-native-reanimated';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { WalletBackupTutorialStep } from './WalletBackupTutorialStep';
import { RecoveryCardSvg } from '../../assets/RecoveryCardSvg';

export type WalletBackupTutorialNumberedStepProps = {
    currentStepIndex: SharedValue<number>;
};

export const WalletBackupTutorialStep1 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <WalletBackupTutorialStep
        stepId="walletBackupTutorialStep1"
        callout={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step1.callout" />
        }
        title={<Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step1.title" />}
        description={
            <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step1.description" />
        }
        currentStepIndex={currentStepIndex}
    >
        <Box flex={1} justifyContent="center" alignItems="center">
            <RecoveryCardSvg />
        </Box>
    </WalletBackupTutorialStep>
);
