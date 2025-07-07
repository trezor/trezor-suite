import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

export const DeviceCheckBackupCard = () => {
    const { navigateToCheckBackup } = useNavigateToCheckBackup();

    return (
        <DeviceSettingsItemCard
            icon="trezorBackup"
            onPress={navigateToCheckBackup}
            title={<Translation id="moduleDeviceSettings.checkBackup.title" />}
            subtitle={<Translation id="moduleDeviceSettings.checkBackup.subtitle" />}
            testID="@device-check-backup/redirectToDeviceCheckBackupScreen"
        />
    );
};
