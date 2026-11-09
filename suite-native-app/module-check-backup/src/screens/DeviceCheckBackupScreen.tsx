import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useInterceptNativeNavigation } from '@suite-native/navigation';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';
import { useCheckBackupOnMount } from '../hooks/useCheckBackupOnMount';

export const DeviceCheckBackupScreen = () => {
    useCheckBackupOnMount();
    useInterceptNativeNavigation();

    return (
        <CheckBackupScreenWithExitButton noBottomPadding>
            <ContinueOnTrezorScreenContent titleTxKey="moduleCheckBackup.checkBackupScreen.title" />
        </CheckBackupScreenWithExitButton>
    );
};
