import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { useCheckBackupOnMount } from '../hooks/useCheckBackupOnMount';

export const DeviceCheckBackupScreen = () => {
    useCheckBackupOnMount();

    return (
        <Screen header={<ScreenHeader closeActionType="close" />} noBottomPadding>
            <ContinueOnTrezorScreenContent titleTxKey="moduleCheckBackup.checkBackupScreen.title" />
        </Screen>
    );
};
