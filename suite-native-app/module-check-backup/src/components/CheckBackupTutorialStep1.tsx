import { type SharedValue } from 'react-native-reanimated';

import { Translation } from '@suite-native/intl';

import { CheckBackupTutorialStep } from './CheckBackupTutorialStep';

export type WalletBackupTutorialNumberedStepProps = {
    currentStepIndex: SharedValue<number>;
};

export const CheckBackupTutorialStep1 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => (
    <CheckBackupTutorialStep
        stepId="checkBackupTutorialStep1"
        currentStepIndex={currentStepIndex}
        callout={<Translation id="moduleCheckBackup.checkBackupTutorialScreen.step1.callout" />}
        title={<Translation id="moduleCheckBackup.checkBackupTutorialScreen.step1.title" />}
        description={
            <Translation id="moduleCheckBackup.checkBackupTutorialScreen.step1.description" />
        }
    />
);
