import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const XpubUnverifiedWarning = () => (
    <Box paddingHorizontal="sp16">
        <PictogramTitleHeader
            variant="warning"
            title={
                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.unverifiedWarning.title" />
            }
            subtitle={
                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.unverifiedWarning.subtitle" />
            }
        />
    </Box>
);
