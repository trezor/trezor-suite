import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { WalletBackupType } from '../../../hooks/useWalletBackupPicker';

interface CardContentProps {
    type: WalletBackupType;
}

export const CardContent = ({ type }: CardContentProps) => {
    const showTime = type === 'single-share' || type === 'multi-share';

    return (
        <VStack spacing="sp16" marginTop="sp16">
            {showTime && (
                <HStack>
                    <Icon name="timer" size="mediumLarge" />
                    <VStack spacing="sp4">
                        <Text variant="callout">
                            <Translation id="moduleDeviceOnboarding.walletBackupSheet.timeLabel" />
                        </Text>
                        <Text variant="hint" color="textSubdued">
                            <Translation
                                id={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.time`}
                                values={{
                                    bold: chunks => (
                                        <Text color="textSubdued" variant="callout">
                                            {chunks}
                                        </Text>
                                    ),
                                }}
                            />
                        </Text>
                    </VStack>
                </HStack>
            )}
            <HStack>
                <Icon name="article" size="mediumLarge" />
                <VStack spacing="sp4" flex={1}>
                    <Text variant="callout">
                        <Translation id="moduleDeviceOnboarding.walletBackupSheet.formatLabel" />
                    </Text>
                    <Text variant="hint" color="textSubdued">
                        <Translation
                            id={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.format`}
                            values={{
                                bold: chunks => (
                                    <Text color="textSubdued" variant="callout">
                                        {chunks}
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                </VStack>
            </HStack>
            <HStack>
                <Icon name="package" size="mediumLarge" />
                <VStack spacing="sp4" flex={1}>
                    <Text variant="callout">
                        <Translation id="moduleDeviceOnboarding.walletBackupSheet.storageLabel" />
                    </Text>
                    <Text variant="hint" color="textSubdued">
                        <Translation
                            id={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.storage`}
                        />
                    </Text>
                </VStack>
            </HStack>
        </VStack>
    );
};
