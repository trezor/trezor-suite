import { useSelector } from 'react-redux';

import {
    selectIsDeviceBackupUnfinished,
    selectIsDeviceInBootloader,
    selectIsDeviceInitialized,
} from '@suite-common/device';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { CheckBackupCard } from '../components/CheckBackupCard';
import { PassphraseCard } from '../components/PassphraseCard';

export const BackupAndPassphraseScreen = () => {
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    // Backup can't be checked in bootloader mode, so only passphrase settings remain.
    const isCheckBackupAvailable =
        isDeviceInitialized && !isDeviceBackupUnfinished && !isDeviceInBootloader;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.backupAndPassphrase.title" />}
                    closeActionType="back"
                />
            }
        >
            <VStack spacing="sp16">
                {isCheckBackupAvailable && <CheckBackupCard />}
                <PassphraseCard />
            </VStack>
        </Screen>
    );
};
