import { type BackupType } from '@suite-common/suite-types';
import { VStack } from '@suite-native/atoms';

import { CardContentRow } from './CardContentRow';
import { walletBackupSheetCopyByType } from '../presets';

type CardContentProps = {
    type: BackupType;
};

export const CardContent = ({ type }: CardContentProps) => {
    const isTimeDisplayed = type === 'shamir-single' || type === 'shamir-advanced';

    return (
        <VStack spacing="sp16">
            {isTimeDisplayed && (
                <CardContentRow
                    labelId="moduleDeviceOnboarding.walletBackupSheet.timeLabel"
                    descriptionId={walletBackupSheetCopyByType[type].timeDescription}
                    iconName="timer"
                />
            )}
            <CardContentRow
                labelId="moduleDeviceOnboarding.walletBackupSheet.formatLabel"
                descriptionId={walletBackupSheetCopyByType[type].formatDescription}
                iconName="article"
            />
            <CardContentRow
                labelId="moduleDeviceOnboarding.walletBackupSheet.storageLabel"
                descriptionId={walletBackupSheetCopyByType[type].storageDescription}
                iconName="package"
            />
        </VStack>
    );
};
