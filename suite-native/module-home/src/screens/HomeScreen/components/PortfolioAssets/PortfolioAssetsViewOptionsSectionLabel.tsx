import { Box, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type PortfolioAssetsViewOptionsSectionLabelProps = {
    labelId: TxKeyPath;
};

export const PortfolioAssetsViewOptionsSectionLabel = ({
    labelId,
}: PortfolioAssetsViewOptionsSectionLabelProps) => (
    <Box paddingHorizontal="sp20" paddingVertical="sp8">
        <Text variant="body-xs" color="contentSecondary">
            <Translation id={labelId} />
        </Text>
    </Box>
);
