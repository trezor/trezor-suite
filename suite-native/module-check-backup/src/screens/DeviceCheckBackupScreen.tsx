import { ContinueOnTrezorScreenContent } from '@suite-native/device';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';
import { useCheckBackupOnMount } from '../hooks/useCheckBackupOnMount';

export const DeviceCheckBackupScreen = () => {
    useCheckBackupOnMount();

    return (
        <CheckBackupScreenWithExitButton noBottomPadding>
            <ContinueOnTrezorScreenContent titleTxKey="moduleCheckBackup.checkBackupScreen.title" />
        </CheckBackupScreenWithExitButton>
    );
};
