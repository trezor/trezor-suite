import { HStack, Radio, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { Color } from '@trezor/theme';

import { WalletBackupType } from './WalletBackupSheet';

interface CardHeaderProps {
    isSelected: boolean;
    type: WalletBackupType;
}

const descriptionColor: Record<WalletBackupType, Color> = {
    'shamir-single': 'textSecondaryHighlight',
    'shamir-advanced': 'textAlertYellow',
    '12-words': 'textAlertBlue',
    '24-words': 'textAlertBlue',
};

export const CardHeader = ({ type, isSelected }: CardHeaderProps) => {
    const { translate } = useTranslate();

    return (
        <HStack>
            <VStack spacing={0} justifyContent="space-between" flex={1}>
                <TitleHeader
                    title={translate(
                        `moduleDeviceOnboarding.walletBackupSheet.options.${type}.title`,
                    )}
                />
                <Text color={descriptionColor[type]} variant="hint">
                    <Translation
                        id={`moduleDeviceOnboarding.walletBackupSheet.options.${type}.description`}
                    />
                </Text>
            </VStack>
            <Radio disabled isChecked={isSelected} value="single" onPress={() => undefined} />
        </HStack>
    );
};
