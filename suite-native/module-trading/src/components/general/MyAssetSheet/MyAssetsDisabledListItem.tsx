import { useIntl } from 'react-intl';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type MyAssetsDisabledListItemProps = {
    count: number;
};

export const MyAssetsDisabledListItem = ({ count }: MyAssetsDisabledListItemProps) => {
    const intl = useIntl();

    return (
        <Box padding="sp12" justifyContent="center" alignItems="center">
            <Text variant="body-sm" color="contentPrimary">
                <Translation
                    id="moduleTrading.myAssetSheet.nonTradeable"
                    values={{ count: intl.formatNumber(count) }}
                />
            </Text>
        </Box>
    );
};
