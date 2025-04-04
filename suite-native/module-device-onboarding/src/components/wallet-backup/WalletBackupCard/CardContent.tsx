import { VStack } from '@suite-native/atoms';

import { CardContentRow } from './CardContentRow';
import { WalletBackupType } from '../WalletBackupSheet';

type CardContentProps = {
    type: WalletBackupType;
};

export const CardContent = ({ type }: CardContentProps) => {
    const isTimeDisplayed = type === 'shamir-single' || type === 'shamir-advanced';

    return (
        <VStack spacing="sp16">
            {isTimeDisplayed && (
                <CardContentRow
                    labelId="moduleDeviceOnboarding.walletBackupSheet.timeLabel"
                    descriptionId={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.time`}
                    iconName="timer"
                />
            )}
            <CardContentRow
                labelId="moduleDeviceOnboarding.walletBackupSheet.formatLabel"
                descriptionId={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.format`}
                iconName="article"
            />
            <CardContentRow
                labelId="moduleDeviceOnboarding.walletBackupSheet.storageLabel"
                descriptionId={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.storage`}
                iconName="package"
            />
        </VStack>
    );
};
