import { type BackupType } from '@suite-common/suite-types';
import { Box, HStack, Radio, Text, TitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type Color } from '@trezor/theme';

import { walletBackupSheetCopyByType } from '../presets';

interface CardHeaderProps {
    isSelected: boolean;
    type: BackupType;
}

const descriptionColor: Record<BackupType, Color> = {
    'shamir-single': 'contentBrand',
    'shamir-advanced': 'contentWarning',
    '12-words': 'contentInfo',
    '24-words': 'contentInfo',
};

export const CardHeader = ({ type, isSelected }: CardHeaderProps) => (
    <HStack>
        <Box flex={1}>
            <TitleHeader title={<Translation id={walletBackupSheetCopyByType[type].title} />} />
            <Text color={descriptionColor[type]} variant="body-sm">
                <Translation id={walletBackupSheetCopyByType[type].description} />
            </Text>
        </Box>
        <Radio disabled isChecked={isSelected} value="single" onPress={() => undefined} />
    </HStack>
);
