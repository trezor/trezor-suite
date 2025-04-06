import { Box, HStack, Radio, Text, TitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Color } from '@trezor/theme';

import { WalletBackupType } from '../../../screens/WalletBackupTutorialScreen';
import { walletBackupSheetCopyByType } from '../presets';

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

export const CardHeader = ({ type, isSelected }: CardHeaderProps) => (
    <HStack>
        <Box flex={1}>
            <TitleHeader title={<Translation id={walletBackupSheetCopyByType[type].title} />} />
            <Text color={descriptionColor[type]} variant="hint">
                <Translation id={walletBackupSheetCopyByType[type].title} />
            </Text>
        </Box>
        <Radio disabled isChecked={isSelected} value="single" onPress={() => undefined} />
    </HStack>
);
