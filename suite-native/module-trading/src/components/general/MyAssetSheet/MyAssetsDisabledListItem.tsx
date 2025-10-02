import { Box, Text } from '@suite-native/atoms';
import { formatNumberWithThousandCommas } from '@suite-native/formatters/src/utils';
import { Translation } from '@suite-native/intl';

export type MyAssetsDisabledListItemProps = {
    count: number;
};

export const MyAssetsDisabledListItem = ({ count }: MyAssetsDisabledListItemProps) => (
    <Box padding="sp12" justifyContent="center" alignItems="center">
        <Text variant="hint" color="textDefault">
            <Translation
                id="moduleTrading.myAssetSheet.nonTradeable"
                values={{ count: formatNumberWithThousandCommas(count) }}
            />
        </Text>
    </Box>
);
