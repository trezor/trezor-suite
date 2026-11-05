import { type HiddenTokenReason } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

const SECTION_TITLES = {
    hiddenByUser: 'moduleAssets.hiddenTokensScreen.hiddenByUserSection',
    unrecognized: 'moduleAccountManagement.accountOverviewScreen.hiddenTokensSection.title',
} as const satisfies Record<HiddenTokenReason, TxKeyPath>;

type HiddenTokensSectionHeaderProps = {
    reason: HiddenTokenReason;
};

export const HiddenTokensSectionHeader = ({ reason }: HiddenTokensSectionHeaderProps) => (
    <Box paddingHorizontal="sp16" paddingTop="sp12" paddingBottom="sp4">
        <Text variant="body-xs" color="contentSecondary">
            <Translation id={SECTION_TITLES[reason]} />
        </Text>
    </Box>
);
