import { useSelector } from 'react-redux';

import { selectIsDeviceBackupUnfinished, selectIsDeviceInitialized } from '@suite-common/device';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { CheckBackupCard } from '../components/CheckBackupCard';
import { PassphraseCard } from '../components/PassphraseCard';

export const BackupAndPassphraseScreen = () => {
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isCheckBackupAvailable = isDeviceInitialized && !isDeviceBackupUnfinished;

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
