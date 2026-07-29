import { useSelector } from 'react-redux';

import { selectIsDeviceBackupUnfinished, selectIsDeviceInitialized } from '@suite-common/device';
import { VStack } from '@suite-native/atoms';
import { selectIsCreateAdditionalBackupAvailable } from '@suite-native/backup';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { CheckBackupCard } from '../components/CheckBackupCard';
import { CreateAdditionalBackupCard } from '../components/CreateAdditionalBackupCard';
import { PassphraseCard } from '../components/PassphraseCard';

export const BackupAndPassphraseScreen = () => {
    const isNfcBackupEnabled = useFeatureFlag(FeatureFlag.IsNfcBackupEnabled);

    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const hasAdditionalBackupSupport = useSelector(selectIsCreateAdditionalBackupAvailable);

    const isCheckBackupAvailable = isDeviceInitialized && !isDeviceBackupUnfinished;
    const isCreateAdditionalBackupAvailable = isNfcBackupEnabled && hasAdditionalBackupSupport;

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
                {isCreateAdditionalBackupAvailable && <CreateAdditionalBackupCard />}
                <PassphraseCard />
            </VStack>
        </Screen>
    );
};
